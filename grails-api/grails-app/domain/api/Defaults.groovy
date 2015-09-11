package api

class Defaults {
    BigDecimal totalIncome = 0.00
    BigDecimal totalExpenses = 0.00
    BigDecimal owner1Income = 0.0
    BigDecimal owner2Income = 0.0
    BigDecimal owner1Personal = 0.0
    BigDecimal owner2Personal = 0.0
    BigDecimal owner1Owe = 0.0
    BigDecimal owner2Owe = 0.0

    static hasMany = [
            owners  : Owner,
            incomes : DefaultIncome,
            expenses: DefaultExpense
    ]

    static mapping = {
        owners cascade: 'all-delete-orphan'
        incomes cascade: 'all-delete-orphan'
        expenses cascade: 'all-delete-orphan'
    }

    static constraints = {
        owner1Income nullable: true
        owner2Income nullable: true
        owner1Personal nullable: true
        owner2Personal nullable: true
        owner1Owe nullable: true
        owner2Owe nullable: true
    }
}
