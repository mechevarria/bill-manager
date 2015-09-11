package api

class DefaultIncome {

    String owner
    String description
    BigDecimal amount = 0.00

    static belongsTo = [defaults: Defaults]

    static constraints = {
    }
}
