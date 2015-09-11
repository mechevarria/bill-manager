package api

class Owner {
    String name
    String label
    String color

    static belongsTo = [defaults: Defaults]

    static constraints = {
    }
}
