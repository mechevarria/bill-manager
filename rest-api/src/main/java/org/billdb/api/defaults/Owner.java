package org.billdb.api.defaults;

import com.fasterxml.jackson.annotation.JsonBackReference;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.ManyToOne;

@Entity
public class Owner {

    @Id
    @GeneratedValue
    private long id;
    private String name;
    private String label;
    private String color;

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

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public DefaultsModel getDefaults() {
        return defaults;
    }

    public void setDefaults(DefaultsModel defaults) {
        this.defaults = defaults;
    }
}
