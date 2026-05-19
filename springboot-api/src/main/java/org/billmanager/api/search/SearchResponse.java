package org.billmanager.api.search;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SearchResponse {

    private int totalCount;

    private double totalAmount;

    private List<SearchDoc> results;

    private Facets facets;

    @Getter
    @Setter
    public static class Facets {
        private List<Facet<String>> categories;
        private List<Facet<String>> years;
        private List<Facet<Integer>> priceBuckets;
    }

    @Getter
    @Setter
    public static class Facet<T> {
        private T label;
        private int count;

        public Facet(T label, int count) {
            this.label = label;
            this.count = count;
        }
    }
}
