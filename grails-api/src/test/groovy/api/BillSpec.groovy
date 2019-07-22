package api

import grails.test.mixin.TestMixin
import grails.test.mixin.Mock
import grails.test.mixin.support.GrailsUnitTestMixin
import spock.lang.*

@TestMixin(GrailsUnitTestMixin)
@Mock([Bill])
class BillSpec extends Specification {

    def setup() {
        new Bill([Date: new Date(), month: '05', year: '2016']).save(flush: true)
    }

    def cleanup() {
    }

    void "bill is saved"() {
        expect:"bill to be saved"
          Bill.count() == 1
    }
}
