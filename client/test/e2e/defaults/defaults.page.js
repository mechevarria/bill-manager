'use strict';

var DefaultsPage = function() {
    this.get = function() {
        browser.get('#/defaults');
    };

    this.heading = function() {
        return element(by.id('defaults-heading')).getText();
    };

    this.incomeTab = function() {
        return element(by.id('income-tab')).element(by.tagName('a'));
    };

    this.expenseTab = function() {
        return element(by.id('expense-tab')).element(by.tagName('a'));
    };

    this.addIncome = function(owner, description, amount) {
        element(by.partialButtonText('Add Income'))
            .click();

        element.all(by.cssContainingText('option', owner)).first()
            .click();
        element.all(by.model('income.description')).first()
            .sendKeys(description);
        element.all(by.model('income.amount')).first().clear()
            .sendKeys(amount);
    };

    this.addExpense = function(hasDetails, name, amount, paidBy) {
        element(by.partialButtonText('Add Expense'))
            .click();

        if (hasDetails) {
            element(by.partialButtonText('Details'))
                .click();
        }

        element.all(by.model('expense.name')).first()
            .sendKeys(name);
        element.all(by.model('expense.amount')).first().clear()
            .sendKeys(amount);
        element(by.id('expense-tab')).element(by.cssContainingText('option', paidBy))
            .click();

    };
};

module.exports = DefaultsPage;
