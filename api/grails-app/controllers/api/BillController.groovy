package api

import grails.converters.JSON
import grails.transaction.Transactional
import org.apache.commons.logging.LogFactory

@Transactional(readOnly = true)
class BillController {

    private static final log = LogFactory.getLog(this)

    static allowedMethods = [save: "POST", update: "PUT", delete: "DELETE"]

    def index() {
        def size = params.size
        def start = params.start
        def sort = params.sort
        def order = params.order

        def bills
        if (size && start && sort && order) {
            log.info "listing bills with max $size, offset $start, sort $sort, order $order"
            bills = Bill.list(max: size, offset: start, sort: sort, order: order)
        } else {
            log.info "listing all bills"
            bills = Bill.list()
        }
        def count = Bill.count()

        def results = [
                "bills": bills,
                "count": count
        ]

        render(status: 200, text: results as JSON, contentType: "application/json", encoding: "UTF-8")
    }

    def ids() {
        def ids = Bill.executeQuery("select b.id from Bill b")

        render(status: 200, text: ids as JSON, contentType: "application/json", encoding: "UTF-8")
    }

    def get() {
        log.info "getting bill with id=$params.id"

        try {
            JSON.use("deep")
            render(status: 200, text: Bill.findById(params.id) as JSON, contentType: "application/json", encoding: "UTF-8")
        } catch (Exception ex) {
            render(status: 400, text: ex.message, contentType: "text/HTML", encoding: "UTF-8")
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

            bill.save flush: true

            JSON.use("deep")
            render(status: 200, text: bill as JSON, contentType: "application/json", encoding: "UTF-8")
        } catch (Exception ex) {
            render(status: 400, text: ex.message, contentType: "text/HTML", encoding: "UTF-8")
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
            def billInstance = Bill.findById(params.id)

            def message = ["msg": "$billInstance.month - $billInstance.year successfully deleted"]

            billInstance.delete flush: true

            render(status: 200, text: message as JSON, contentType: "application/json", encoding: "UTF-8")
        } catch (Exception ex) {
            render(status: 400, text: ex.message, contentType: "text/HTML", encoding: "UTF-8")
        }
    }
}
