package org.billdb.api.defaults;

import com.fasterxml.jackson.annotation.JsonBackReference;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.ManyToOne;

@Entity
public class DefaultIncome {

    @Id
    @GeneratedValue
    private long id;
    private String owner;
    private String description;
    private double amount = 0.00;

    @JsonBackReference
    @ManyToOne
    private DefaultsModel defaults;

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getOwner() {
        return owner;
    }

    public void setOwner(String owner) {
        this.owner = owner;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public DefaultsModel getDefaults() {
        return defaults;
    }

    public void setDefaults(DefaultsModel defaults) {
        this.defaults = defaults;
    }
}
