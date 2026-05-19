package org.billmanager.api.bill;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;

import java.util.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;

import org.hibernate.annotations.UpdateTimestamp;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Detail implements java.io.Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(unique = true)
    private long id;

    private String date;
    private Date detailDate;
    private String reference;
    private String type;
    private String description;
    private Double amount = 0.0;
    private String personal;
    
    @UpdateTimestamp
    private Date lastUpdated;

    @ManyToOne
    private Expense expense;
}
