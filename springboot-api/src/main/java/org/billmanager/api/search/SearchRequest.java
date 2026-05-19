package org.billmanager.api.search;

import java.util.Collections;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SearchRequest {

    public enum Operator { AND, OR }

    private List<String> text = Collections.emptyList();

    private List<String> category = Collections.emptyList();

    private List<Integer> yearStart = Collections.emptyList();

    private List<Integer> priceBucket = Collections.emptyList();

    private Operator op = Operator.OR;
}
