package org.billmanager.api.bill;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;

import java.util.Date;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;

import org.hibernate.annotations.UpdateTimestamp;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
@Table(uniqueConstraints = @UniqueConstraint(columnNames = { "month", "year" }))
public class Bill implements java.io.Serializable {
    private static final long serialVersionUID = 1L;

    public Bill(Long id, Date billDate, String month, String year, Double totalExpense, Double totalIncome, Double owner1Income, Double owner2Income, Double owner1Personal, Double owner2Personal, Double owner1Owe, Double owner2Owe, Date lastUpdated) {
        this.id = id;
        this.billDate = billDate;
        this.month = month;
        this.year = year;
        this.totalExpense = totalExpense;
        this.totalIncome = totalIncome;
        this.owner1Income = owner1Income;
        this.owner2Income = owner2Income;
        this.owner1Personal = owner1Personal;
        this.owner2Personal = owner2Personal;
        this.owner1Owe = owner1Owe;
        this.owner2Owe = owner2Owe;
        this.lastUpdated = lastUpdated;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(unique = true)
    private long id;

    private Date billDate;
    private String month;
    private String year;
    private Double totalIncome = 0.00;
    private Double totalExpense = 0.00;
    private Double owner1Income = 0.0;
    private Double owner2Income = 0.0;
    private Double owner1Personal = 0.0;
    private Double owner2Personal = 0.0;
    private Double owner1Owe = 0.0;
    private Double owner2Owe = 0.0;

    @UpdateTimestamp
    private Date lastUpdated;

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private Set<Expense> expenses = new HashSet<>();

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private Set<Income> incomes = new HashSet<>();
}
