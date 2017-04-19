package org.billdb.api.defaults;

import com.fasterxml.jackson.annotation.JsonBackReference;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.ManyToOne;

@Entity
public class DefaultExpense {

    @Id
    @GeneratedValue
    private long id;
    private String name;
    private double amount = 0.0;
    private String paid;
    private Boolean hasDetails = false;

    @JsonBackReference
    @ManyToOne
    private DefaultsModel defaults;

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getPaid() {
        return paid;
    }

    public void setPaid(String paid) {
        this.paid = paid;
    }

    public Boolean getHasDetails() {
        return hasDetails;
    }

    public void setHasDetails(Boolean hasDetails) {
        this.hasDetails = hasDetails;
    }

    public DefaultsModel getDefaults() {
        return defaults;
    }

    public void setDefaults(DefaultsModel defaults) {
        this.defaults = defaults;
    }
}
