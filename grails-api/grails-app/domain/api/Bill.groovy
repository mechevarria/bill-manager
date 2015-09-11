package api

class Bill {
    Date billDate
    String month
    String year
    BigDecimal totalIncome = 0.00
    BigDecimal totalExpense = 0.00
    BigDecimal owner1Income = 0.0
    BigDecimal owner2Income = 0.0
    BigDecimal owner1Personal = 0.0
    BigDecimal owner2Personal = 0.0
    BigDecimal owner1Owe = 0.0
    BigDecimal owner2Owe = 0.0
    Date lastUpdated

    static hasMany = [
            incomes : Income,
            expenses: Expense
    ]

    static mapping = {
        incomes lazy: true
        expenses lazy: true
        incomes cascade: 'all-delete-orphan'
        expenses cascade: 'all-delete-orphan'
    }

    static constraints = {
        month unique: 'year'
        owner1Income nullable: true
        owner2Income nullable: true
        owner1Personal nullable: true
        owner2Personal nullable: true
        owner1Owe nullable: true
        owner2Owe nullable: true
        billDate nullable: true
        lastUpdated nullable: true
    }
}
