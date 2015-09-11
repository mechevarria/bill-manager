package api

import grails.converters.JSON
import grails.transaction.Transactional
import org.apache.commons.logging.LogFactory

@Transactional(readOnly = true)
class BillController {

    private static final log = LogFactory.getLog(this)

    def index() {
        def bills = Bill.list(max: params.size, offset: params.start, sort: params.sort, order: params.order)
        def count = Bill.count()

        def results = [
                "bills": bills,
                "count": count
        ]

        render results as JSON
    }

    def ids() {
        def ids = Bill.executeQuery("select b.id from Bill b")

        render ids as JSON
    }

    def get() {
        log.info "getting bill with id=$params.id"

        try {
            JSON.use("deep")
            render Bill.findById(params.id) as JSON
        } catch (Exception ex) {
            render(status: 500, text: ex.message)
        }
    }

    @Transactional
    def save(Bill bill) {
        try {
            log.info("Saving $bill.month - $bill.year")
            bill.billDate = new Date().parse("dd-MMMM-yyyy", "01-$bill.month-$bill.year")

            bill.expenses.each { expense ->
                expense.details.each { detail ->

                    if (detail.date != null) {
                        detail.detailDate = new Date().parse("MM/dd/yyyy", detail.date)
                    } else {
                        detail.detailDate = bill.billDate
                    }
                    expense.addToDetails(detail)
                }

                expense.month = bill.month
                expense.year = bill.year
                expense.expenseDate = bill.billDate
                bill.addToExpenses(expense)
            }

            bill.incomes.each { income ->
                income.month = bill.month
                income.year = bill.year
                income.incomeDate = bill.billDate
                bill.addToIncomes(income)
            }

            if (!bill.validate()) {
                def message
                if (bill.errors.hasFieldErrors("month")) {
                    message = "$bill.month - $bill.year already exists"
                } else {
                    message = "Could not update $bill.month - $bill.year due to validation errors"
                }

                throw new Exception(message)
            }

            bill.save(flush: true)

            JSON.use("deep")
            render bill as JSON
        } catch (Exception ex) {
            render(status: 500, text: ex.message)
        }
    }

    @Transactional
    def update(Bill bill) {
        save(bill)
    }

    @Transactional
    def delete() {
        log.info "deleting bill with id=$params.id"

        try {
            def bill = Bill.findById(params.id)

            def message = "$bill.month - $bill.year successfully deleted"

            bill.delete(flush: true)

            render(status: 200, text: message)
        } catch (Exception ex) {
            render(status: 500, text: ex.message)
        }
    }
}
