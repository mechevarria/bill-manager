'use strict';

describe('Defaults', function() {

    var DefaultsPage = require('./defaults.page.js');
    var page = new DefaultsPage();

    it('page should be available', function() {
        page.get();

        expect(page.heading()).
        toEqual('DEFAULTS WHEN ADDING NEW');
    });

    it('should be able to add incomes', function() {
        var incomeTab = page.incomeTab();
        incomeTab.click();

        page.addIncome('owner2', 'salary', '5000');
        page.addIncome('owner1','salary','5100');

    });

    it('should be able to add expenses', function() {
        var expenseTab = page.expenseTab();
        expenseTab.click();

        page.addExpense(false, 'electric', '102.12', 'owner1');

    });
});
