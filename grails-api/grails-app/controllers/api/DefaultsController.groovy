package api

import grails.converters.JSON
import grails.transaction.Transactional

@Transactional(readOnly = true)
class DefaultsController {

    def index() {
        JSON.use('deep')

        render Defaults.first() as JSON
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

            defaults.save(flush: true)

            index()

        } catch (Exception ex) {
            render(status:500, text:ex.message)
        }
    }
}
