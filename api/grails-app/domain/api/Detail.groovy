package api

class Detail {
    String date
    Date detailDate
    String reference
    String type
    String description
    BigDecimal amount = 0.0
    String personal
    Date lastUpdated

    static belongsTo = [expense: Expense]
    static constraints = {
        detailDate nullable: true
        date nullable: true
        reference nullable: true
        type nullable: true
        description nullable: true
        personal nullable: true
        lastUpdated nullable: true
    }
}
