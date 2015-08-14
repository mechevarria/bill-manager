'use strict';

app.controller('ChartCtrl', function($scope, BillSrvc) {

    function sortFunction(a, b) {
        return b[0] - a[0];
    }

    function setIncomeExpense(expenses, incomes, year) {

        if (year) {
            expenses = _.filter(expenses, function(expense) {
                return expense[2] == year;
            });

            incomes = _.filter(incomes, function(income) {
                return income[2] == year;
            });
        }

        $scope.expenseIncome = {
            options: {
                chart: {
                    type: 'line',
                    height: 350
                },
                exporting: {
                    enabled: false
                },
                xAxis: {
                    type: 'datetime'
                },
                yAxis: {
                    title: {
                        text: ''
                    }
                },
                tooltip: {
                    headerFormat: '<span style="font-size: 10px">{point.key:%m/%Y}</span><br/>',
                    pointFormat: '${point.y:,.2f}'
                }
            },
            series: [{
                name: 'Income',
                data: incomes,
                color: '#93c54b'
            }, {
                name: 'Expense',
                data: expenses,
                color: '#d9534f'
            }],
            loading: false,
            credits: {
                enabled: false
            },
            title: {
                text: ''
            }
        };
    }

    function setSumTotal(bills, year) {
        var sumIncome = 0;
        var sumExpense = 0;

        if (year) {
            bills = _.filter(bills, function(bill) {
                return bill.year == year;
            });
        }

        angular.forEach(bills, function(bill) {
            sumIncome += bill.totalIncome;
            sumExpense += bill.totalExpense;
        });

        $scope.sumTotal = {
            options: {
                chart: {
                    height: 350
                },
                exporting: {
                    enabled: false
                },
                tooltip: {
                    pointFormat: '${point.y:,.2f}'
                },
                plotOptions: {
                    pie: {
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: true,
                            distance: 10,
                            format: '<span style="color:{point.color}">{point.name}</span><br/><span style="color:{point.color}">{point.percentage:.1f} %</span>'
                        }
                    }
                }
            },
            series: [{
                type: 'pie',
                data: [{
                    name: 'Total Income',
                    y: sumIncome,
                    color: '#93c54b'
                }, {
                    name: 'Total Expense',
                    y: sumExpense,
                    color: '#d9534f'
                }]
            }],
            loading: false,
            credits: {
                enabled: false
            },
            title: {
                text: ''
            }

        };
    }

    var defaultChart = {
        title: {
            text: ''
        },
        options: {
            exporting: {
                enabled: false
            }
        },
        loading: true
    };

    function init() {
        // initialize
        $scope.allBills = [];
        $scope.sumTotal = defaultChart;
        $scope.expenseIncome = defaultChart;

        $scope.years = [{
            'label': 'All',
            'value': ''
        }];
        $scope.selectedYear = $scope.years[0];

        BillSrvc.getAllBills().then(function(data) {
            $scope.allBills = data.bills;

            $scope.expenses = [];
            $scope.incomes = [];
            var years = [];

            var date;

            angular.forEach($scope.allBills, function(bill) {
                date = new Date(bill.billDate).getTime();

                years.push({
                    'label': bill.year,
                    'value': bill.year
                });

                $scope.expenses.push([date, bill.totalExpense, bill.year]);

                $scope.incomes.push([date, bill.totalIncome, bill.year]);

            });

            $scope.years = $scope.years.concat(_.uniq(years, 'value'));
            $scope.years = _.sortBy($scope.years, 'value');

            // sort arrays by date
            $scope.expenses.sort(sortFunction);
            $scope.incomes.sort(sortFunction);

            setIncomeExpense($scope.expenses, $scope.incomes, $scope.selectedYear.value);

            setSumTotal($scope.allBills, $scope.selectedYear.value);

        });
    }

    init();

    $scope.filterYear = function() {
        setIncomeExpense($scope.expenses, $scope.incomes, $scope.selectedYear.value);
        setSumTotal($scope.allBills, $scope.selectedYear.value);
    };

});
