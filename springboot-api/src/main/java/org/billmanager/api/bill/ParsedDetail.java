package org.billmanager.api.bill;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ParsedDetail {

    private String date;

    private String reference;

    private String type;

    private String description;

    private Double amount;

    private String personal;
}
