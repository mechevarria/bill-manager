package org.billdb.api.defaults;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import javax.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
public class DefaultsModel {

    @Id
    @GeneratedValue
    private long id;
    private double totalIncome = 0.0;
    private double totalExpenses = 0.0;
    private double owner1Income = 0.0;
    private double owner2Income = 0.0;
    private double owner1Personal = 0.0;
    private double owner2Personal = 0.0;
    private double owner1Owe = 0.0;
    private double owner2Owe = 0.0;

    @JsonManagedReference
    @OneToMany(mappedBy = "defaults", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<DefaultIncome> incomes = new HashSet<>();

    @JsonManagedReference
    @OneToMany(mappedBy = "defaults", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<DefaultExpense> expenses = new HashSet<>();

    @JsonManagedReference
    @OneToMany(mappedBy = "defaults", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Owner> owners = new HashSet<>();

    public long getId() {

        return id;
    }

    public void setId(long id) {

        this.id = id;
    }

    public double getTotalIncome() {

        return totalIncome;
    }

    public void setTotalIncome(double totalIncome) {

        this.totalIncome = totalIncome;
    }

    public double getTotalExpenses() {
        return totalExpenses;
    }

    public void setTotalExpenses(double totalExpenses) {

        this.totalExpenses = totalExpenses;
    }

    public double getOwner1Income() {
        return
                owner1Income;
    }

    public void setOwner1Income(double owner1Income) {

        this.owner1Income = owner1Income;
    }

    public double getOwner2Income() {

        return owner2Income;
    }

    public void setOwner2Income(double owner2Income) {

        this.owner2Income = owner2Income;
    }

    public double getOwner1Personal() {

        return owner1Personal;
    }

    public void setOwner1Personal(double owner1Personal) {

        this.owner1Personal = owner1Personal;
    }

    public double getOwner2Personal() {

        return owner2Personal;
    }

    public void setOwner2Personal(double owner2Personal) {

        this.owner2Personal = owner2Personal;
    }

    public double getOwner1Owe() {

        return owner1Owe;
    }

    public void setOwner1Owe(double owner1Owe) {

        this.owner1Owe = owner1Owe;
    }

    public double getOwner2Owe() {

        return owner2Owe;
    }

    public void setOwner2Owe(double owner2Owe) {

        this.owner2Owe = owner2Owe;
    }

    public Set<DefaultIncome> getIncomes() {
        return incomes;
    }

    public void setIncomes(Set<DefaultIncome> incomes) {
        this.incomes = incomes;
    }

    public Set<DefaultExpense> getExpenses() {
        return expenses;
    }

    public void setExpenses(Set<DefaultExpense> expenses) {
        this.expenses = expenses;
    }

    public Set<Owner> getOwners() {
        return owners;
    }

    public void setOwners(Set<Owner> owners) {
        this.owners = owners;
    }
}
