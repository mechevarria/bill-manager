package org.billmanager.api.search;

import java.util.Date;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SearchDoc {

    private String category;

    private Date date;

    private String owner;

    private String description;

    private Double amount;
}
