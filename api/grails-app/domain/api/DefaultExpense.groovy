package api

class DefaultExpense {
    String name
    BigDecimal amount = 0.00
    String paid
    Boolean hasDetails = false

    static belongsTo = [defaults: Defaults]

    static constraints = {
    }
}
