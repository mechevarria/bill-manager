package org.billmanager.api.bill;

import java.io.IOException;
import java.io.Reader;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.billmanager.api.ApiException;
import org.springframework.stereotype.Service;

@Service
public class DetailParserService {

    private static final DateTimeFormatter DATE_FORMAT =
        DateTimeFormatter.ofPattern("M/d/uuuu");

    private static final String AMAZON_SPLIT = " WA ";

    private static final Set<String> SKIP_DESCRIPTIONS = Set.of(
        "ONLINE PAYMENT - THANK YOU",
        "ONLINE PYMT-THANK YOU    ATLANTA      GA",
        "AUTOMATIC PAYMENT - THANK YOU",
        "MOBILE PAYMENT - THANK YOU"
    );

    private static final CSVFormat CSV_FORMAT = CSVFormat.DEFAULT.builder()
        .setIgnoreEmptyLines(true)
        .setIgnoreSurroundingSpaces(true)
        .build();

    public List<ParsedDetail> parse(Reader reader) {
        List<ParsedDetail> details = new ArrayList<>();
        try (CSVParser parser = CSV_FORMAT.parse(reader)) {
            for (CSVRecord row : parser) {
                ParsedDetail detail = parseRow(row);
                if (detail != null && isValid(detail)) {
                    details.add(detail);
                }
            }
        } catch (IOException ex) {
            throw new ApiException("Could not read CSV", ex);
        }
        return details;
    }

    private ParsedDetail parseRow(CSVRecord row) {
        if (!isDate(get(row, 0))) {
            return null;
        }
        return isDate(get(row, 1)) ? parseAmazonRow(row) : parseAmexRow(row);
    }

    private ParsedDetail parseAmexRow(CSVRecord row) {
        ParsedDetail d = new ParsedDetail();
        d.setDate(get(row, 0));
        d.setDescription(get(row, 1));
        d.setAmount(parseAmount(get(row, 4)));
        d.setReference(get(row, 11));
        d.setType(get(row, 12));
        d.setPersonal(get(row, 13));
        return d;
    }

    private ParsedDetail parseAmazonRow(CSVRecord row) {
        ParsedDetail d = new ParsedDetail();
        d.setDate(get(row, 1));
        d.setReference(get(row, 2));
        Double amount = parseAmount(get(row, 3));
        d.setAmount(amount == null ? null : -amount);

        String col4 = get(row, 4);
        if (col4 != null && col4.indexOf(AMAZON_SPLIT) > 0) {
            int splitEnd = col4.indexOf(AMAZON_SPLIT) + AMAZON_SPLIT.length();
            d.setType(col4.substring(0, splitEnd));
            d.setDescription(col4.substring(splitEnd));
        } else {
            d.setDescription(col4);
        }
        d.setPersonal(get(row, 6));
        return d;
    }

    private boolean isValid(ParsedDetail d) {
        if (d.getAmount() == null || d.getDescription() == null) {
            return false;
        }
        return !SKIP_DESCRIPTIONS.contains(d.getDescription());
    }

    private static String get(CSVRecord row, int idx) {
        if (idx < 0 || idx >= row.size()) {
            return null;
        }
        String value = row.get(idx);
        return value == null || value.isEmpty() ? null : value;
    }

    private static boolean isDate(String value) {
        if (value == null) {
            return false;
        }
        try {
            LocalDate.parse(value, DATE_FORMAT);
            return true;
        } catch (DateTimeParseException ex) {
            return false;
        }
    }

    private static Double parseAmount(String value) {
        if (value == null) {
            return 0.0;
        }
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
