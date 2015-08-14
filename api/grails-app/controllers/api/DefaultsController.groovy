package api

import grails.converters.JSON
import grails.transaction.Transactional
import org.apache.commons.logging.LogFactory

@Transactional(readOnly = true)
class DefaultsController {

    private static final log = LogFactory.getLog(this)

    static allowedMethods = [save: "POST", update: "PUT", delete: "DELETE"]

    def index() {

        JSON.use("deep")

        render(status: 200, text: Defaults.first() as JSON, contentType: "application/json", encoding: "UTF-8")
    }

    @Transactional
    def save(Defaults defaults) {
        try {

            defaults.owners.each { o ->
                defaults.addToOwners(o)
            }

            defaults.expenses.each { e ->
                defaults.addToExpenses(e)
            }

            defaults.incomes.each { i ->
                defaults.addToIncomes(i)
            }

            if (!defaults.validate()) {
                throw new Exception("Could not update defaults due to validation errors")
            }

            defaults.save flush: true

            JSON.use("deep")
            render(status: 200, text: defaults as JSON, contentType: "application/json", encoding: "UTF-8")
        } catch (Exception ex) {
            render(status: 400, text: ex.message, contentType: "application/json", encoding: "UTF-8")
        }
    }
}
