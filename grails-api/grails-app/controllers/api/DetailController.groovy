package api

import grails.converters.JSON

class DetailController {

    def index() {
        def details = Detail.list()
        def count = Detail.count()

        def results = [
                "details": details,
                "count": count
        ]

        render results as JSON
    }
}
