package org.billmanager.api.defaults;

import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;

import java.util.HashSet;
import java.util.Set;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.OneToMany;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Defaults implements java.io.Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(unique = true, nullable = false)
    private long id;
    private Double totalIncome = 0.00;
    private Double totalExpenses = 0.00;
    private Double owner1Income = 0.00;
    private Double owner2Income = 0.00;
    private Double owner1Personal = 0.00;
    private Double owner2Personal = 0.00;
    private Double owner1Owe = 0.00;
    private Double owner2Owe = 0.00;

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "defaults_id")
    @JsonManagedReference
    private Set<Owner> owners = new HashSet<>();

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "defaults_id")
    @JsonManagedReference
    private Set<DefaultIncome> incomes = new HashSet<>();

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "defaults_id")
    @JsonManagedReference
    private Set<DefaultExpense> expenses = new HashSet<>();
}
