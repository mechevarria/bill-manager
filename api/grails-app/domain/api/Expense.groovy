package api

class Expense {
    Date expenseDate
	String name
    String month
    String year
    BigDecimal amount = 0.00
    String paid
    Boolean hasDetails = false
    Date lastUpdated

    static mapping = {
        details cascade: 'all-delete-orphan'
    }

    static belongsTo = [bill: Bill]
    static hasMany = [details: Detail]
    static constraints = {
        paid nullable: true
        month nullable: true
        year nullable: true
        expenseDate nullable: true
        lastUpdated nullable: true
    }
}
