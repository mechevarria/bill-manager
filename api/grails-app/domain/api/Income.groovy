package api

class Income {
	String owner
    String description
    BigDecimal amount = 0.00
    Date incomeDate
    String month
    String year
    Date lastUpdated

    static belongsTo = [bill: Bill]
    static constraints = {
        description nullable:true
        month nullable: true
        year nullable: true
        incomeDate nullable: true
        lastUpdated nullable: true
    }
}
