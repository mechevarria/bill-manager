package org.billmanager.api.search;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;

import org.billmanager.api.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

@Service
public class SearchService {

    private static final Logger logger = LoggerFactory.getLogger(SearchService.class);

    private static final int PRICE_BUCKET_SIZE = 100;
    private static final int PRICE_FACET_MAX = 10_000;
    private static final int YEAR_FACET_PAST = 100;
    private static final int YEAR_FACET_FUTURE = 1;

    private enum Source {
        INCOME("income i JOIN owner o ON i.owner = o.name",
               "i.income_date", "i.amount", "i.description", "'income'", "i.id"),
        EXPENSE("expense e JOIN owner o ON e.paid = o.name",
                "e.expense_date", "e.amount", "e.name", "'expense'", "e.id"),
        DETAIL("detail d LEFT JOIN owner o ON d.personal = o.name " +
               "JOIN expense_details ed ON d.id = ed.details_id " +
               "JOIN expense e ON e.id = ed.expense_id",
               "d.detail_date", "d.amount", "d.description", "e.name", "d.id");

        final String fromClause;
        final String dateCol;
        final String amountCol;
        final String descriptionCol;
        final String categoryExpr;
        final String idCol;

        Source(String fromClause, String dateCol, String amountCol,
               String descriptionCol, String categoryExpr, String idCol) {
            this.fromClause = fromClause;
            this.dateCol = dateCol;
            this.amountCol = amountCol;
            this.descriptionCol = descriptionCol;
            this.categoryExpr = categoryExpr;
            this.idCol = idCol;
        }
    }

    @Autowired
    private NamedParameterJdbcTemplate jdbc;

    @PostConstruct
    public void ensureFulltextIndexes() {
        ensureFulltextIndex("income", "description", "idx_income_description_fts");
        ensureFulltextIndex("expense", "name", "idx_expense_name_fts");
        ensureFulltextIndex("detail", "description", "idx_detail_description_fts");
    }

    private void ensureFulltextIndex(String table, String column, String indexName) {
        String existsSql =
            "SELECT COUNT(*) FROM information_schema.STATISTICS " +
            " WHERE table_schema = DATABASE() " +
            "   AND table_name = :table AND index_name = :index";
        MapSqlParameterSource params = new MapSqlParameterSource()
            .addValue("table", table)
            .addValue("index", indexName);
        Integer count = jdbc.queryForObject(existsSql, params, Integer.class);
        if (count != null && count > 0) {
            return;
        }
        String ddl = "CREATE FULLTEXT INDEX " + indexName + " ON " + table + "(" + column + ")";
        jdbc.getJdbcTemplate().execute(ddl);
        logger.info("Created FULLTEXT index {} on {}({})", indexName, table, column);
    }

    public SearchResponse search(SearchRequest req) {
        try {
            List<SearchDoc> docs = new ArrayList<>();
            if (hasAnyParam(req)) {
                for (Source src : Source.values()) {
                    docs.addAll(querySource(src, req));
                }
                docs.sort(Comparator.comparing(SearchDoc::getDate,
                    Comparator.nullsLast(Comparator.reverseOrder())));
            }
            return buildResponse(docs);
        } catch (Exception ex) {
            throw new ApiException("Search failed", ex);
        }
    }

    private List<SearchDoc> querySource(Source src, SearchRequest req) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        List<String> predicates = buildPredicates(src, req, params);
        if (predicates.isEmpty()) {
            return List.of();
        }
        if (req.getOp() == SearchRequest.Operator.AND
                && predicates.stream().anyMatch("1=0"::equals)) {
            return List.of();
        }

        String joiner = req.getOp() == SearchRequest.Operator.AND ? " AND " : " OR ";
        String sql =
            "SELECT " + src.idCol + " AS db_id, " +
                       src.dateCol + " AS item_date, " +
                       "o.label AS author, " +
                       src.descriptionCol + " AS description, " +
                       src.amountCol + " AS amount, " +
                       src.categoryExpr + " AS category " +
            "  FROM " + src.fromClause +
            " WHERE " + String.join(joiner, predicates);

        return jdbc.query(sql, params, (rs, n) -> {
            SearchDoc d = new SearchDoc();
            d.setCategory(rs.getString("category"));
            Timestamp ts = rs.getTimestamp("item_date");
            d.setDate(ts != null ? new Date(ts.getTime()) : null);
            d.setOwner(rs.getString("author"));
            d.setDescription(rs.getString("description"));
            d.setAmount(rs.getObject("amount") != null ? rs.getDouble("amount") : null);
            return d;
        });
    }

    private List<String> buildPredicates(Source src, SearchRequest req,
                                         MapSqlParameterSource params) {
        List<String> predicates = new ArrayList<>();

        String matchExpr = buildMatchAgainst(req.getText(), req.getOp());
        if (matchExpr != null) {
            params.addValue("ftSearch", matchExpr);
            predicates.add("MATCH(" + src.descriptionCol + ") AGAINST(:ftSearch IN BOOLEAN MODE)");
        }

        int i = 0;
        for (String cat : req.getCategory()) {
            if ("income".equals(cat)) {
                predicates.add(src == Source.INCOME ? "1=1" : "1=0");
            } else if ("expense".equals(cat)) {
                predicates.add(src == Source.EXPENSE ? "1=1" : "1=0");
            } else if (src == Source.DETAIL) {
                String key = "cat" + i++;
                predicates.add("e.name = :" + key);
                params.addValue(key, cat);
            } else {
                predicates.add("1=0");
            }
        }

        for (Integer year : req.getYearStart()) {
            String startKey = "yStart" + i;
            String endKey = "yEnd" + i++;
            predicates.add(src.dateCol + " >= :" + startKey + " AND " + src.dateCol + " < :" + endKey);
            params.addValue(startKey, yearStartUtc(year));
            params.addValue(endKey, yearStartUtc(year + 1));
        }

        for (Integer bucket : req.getPriceBucket()) {
            String minKey = "pMin" + i;
            String maxKey = "pMax" + i++;
            predicates.add(src.amountCol + " >= :" + minKey + " AND " + src.amountCol + " < :" + maxKey);
            params.addValue(minKey, bucket);
            params.addValue(maxKey, bucket + PRICE_BUCKET_SIZE);
        }

        return predicates;
    }

    private static String buildMatchAgainst(List<String> terms, SearchRequest.Operator op) {
        if (terms == null || terms.isEmpty()) {
            return null;
        }
        StringBuilder sb = new StringBuilder();
        String prefix = op == SearchRequest.Operator.AND ? "+" : "";
        for (String term : terms) {
            String sanitized = sanitizeFulltext(term);
            if (sanitized.isEmpty()) {
                continue;
            }
            if (sb.length() > 0) sb.append(' ');
            sb.append(prefix).append('"').append(sanitized).append('"');
        }
        return sb.length() == 0 ? null : sb.toString();
    }

    private static String sanitizeFulltext(String term) {
        if (term == null) return "";
        return term.replaceAll("[+\\-<>()~*\"@]", " ").trim().replaceAll("\\s+", " ");
    }

    private boolean hasAnyParam(SearchRequest req) {
        return !req.getText().isEmpty()
            || !req.getCategory().isEmpty()
            || !req.getYearStart().isEmpty()
            || !req.getPriceBucket().isEmpty();
    }

    private SearchResponse buildResponse(List<SearchDoc> docs) {
        SearchResponse out = new SearchResponse();
        out.setTotalCount(docs.size());
        out.setTotalAmount(docs.stream()
            .filter(d -> d.getAmount() != null)
            .mapToDouble(SearchDoc::getAmount).sum());
        out.setResults(docs);

        SearchResponse.Facets facets = new SearchResponse.Facets();
        facets.setCategories(categoryFacet(docs));
        facets.setYears(yearFacet(docs));
        facets.setPriceBuckets(priceFacet(docs));
        out.setFacets(facets);
        return out;
    }

    private List<SearchResponse.Facet<String>> categoryFacet(List<SearchDoc> docs) {
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (SearchDoc d : docs) {
            counts.merge(d.getCategory(), 1, Integer::sum);
        }
        List<SearchResponse.Facet<String>> out = new ArrayList<>();
        counts.entrySet().stream()
            .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
            .forEach(e -> out.add(new SearchResponse.Facet<>(e.getKey(), e.getValue())));
        return out;
    }

    private List<SearchResponse.Facet<String>> yearFacet(List<SearchDoc> docs) {
        int currentYear = Calendar.getInstance(TimeZone.getTimeZone("UTC")).get(Calendar.YEAR);
        int startYear = currentYear - YEAR_FACET_PAST;
        int endYear = currentYear + YEAR_FACET_FUTURE;

        Map<Integer, Integer> counts = new HashMap<>();
        for (SearchDoc d : docs) {
            if (d.getDate() == null) continue;
            Calendar c = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
            c.setTime(d.getDate());
            int y = c.get(Calendar.YEAR);
            if (y >= startYear && y < endYear) {
                counts.merge(y, 1, Integer::sum);
            }
        }
        List<SearchResponse.Facet<String>> out = new ArrayList<>();
        for (int y = endYear - 1; y >= startYear; y--) {
            int count = counts.getOrDefault(y, 0);
            if (count > 0) {
                out.add(new SearchResponse.Facet<>(yearStartIsoString(y), count));
            }
        }
        return out;
    }

    private List<SearchResponse.Facet<Integer>> priceFacet(List<SearchDoc> docs) {
        Map<Integer, Integer> counts = new HashMap<>();
        for (SearchDoc d : docs) {
            if (d.getAmount() == null) continue;
            int bucket = (int) (Math.floor(d.getAmount() / PRICE_BUCKET_SIZE) * PRICE_BUCKET_SIZE);
            if (bucket >= 0 && bucket < PRICE_FACET_MAX) {
                counts.merge(bucket, 1, Integer::sum);
            }
        }
        List<SearchResponse.Facet<Integer>> out = new ArrayList<>();
        for (int b = 0; b < PRICE_FACET_MAX; b += PRICE_BUCKET_SIZE) {
            int count = counts.getOrDefault(b, 0);
            if (count > 0) {
                out.add(new SearchResponse.Facet<>(b, count));
            }
        }
        return out;
    }

    private static Date yearStartUtc(int year) {
        return Date.from(LocalDate.of(year, 1, 1).atStartOfDay(ZoneId.of("UTC")).toInstant());
    }

    private static String yearStartIsoString(int year) {
        return String.format("%04d-01-01T00:00:00.000Z", year);
    }
}
