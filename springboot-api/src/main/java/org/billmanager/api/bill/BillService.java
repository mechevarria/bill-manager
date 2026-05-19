package org.billmanager.api.bill;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.billmanager.api.ApiException;
import org.billmanager.api.NotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class BillService {
    private static final Logger logger = LoggerFactory.getLogger(BillService.class);

    private static final DateTimeFormatter BILL_MONTH_FORMAT =
        DateTimeFormatter.ofPattern("dd-MMMM-uuuu", Locale.ENGLISH);
    private static final DateTimeFormatter DETAIL_DATE_FORMAT =
        DateTimeFormatter.ofPattern("MM/dd/uuuu", Locale.ENGLISH);

    @Autowired
    private BillRepository repository;

    public Map<String, Object> getAll(int size, int start, String sortField, String order) {
        try {
            Sort sort = "desc".equalsIgnoreCase(order) ? Sort.by(sortField).descending() : Sort.by(sortField).ascending();
            logger.info("order={} sortField={}", order, sortField);
            Pageable pageable = PageRequest.of(start, size, sort);
            Page<Bill> page = repository.summary(pageable);

            Map<String, Object> results = new HashMap<>();
            results.put("bills", page.getContent());
            results.put("count", page.getTotalElements());
            return results;
        } catch (Exception ex) {
            throw new ApiException("Could not get bills", ex);
        }
    }

    public Bill save(Bill bill) {
        try {
            String month = bill.getMonth();
            String year = bill.getYear();
            LocalDate parsed = LocalDate.parse("02-" + month + "-" + year, BILL_MONTH_FORMAT);
            Date billDate = Date.from(parsed.atStartOfDay(ZoneId.systemDefault()).toInstant());

            bill.setBillDate(billDate);

            Set<Expense> expenses = new HashSet<>();
            bill.getExpenses().forEach(expense -> {
                Set<Detail> details = new HashSet<>();
                expense.getDetails().forEach(detail -> {
                    if (detail.getDate() != null) {
                        try {
                            LocalDate d = LocalDate.parse(detail.getDate(), DETAIL_DATE_FORMAT);
                            detail.setDetailDate(Date.from(d.atStartOfDay(ZoneId.systemDefault()).toInstant()));
                        } catch (DateTimeParseException ex) {
                            logger.warn("Invalid detail date '{}', clearing", detail.getDate());
                            detail.setDate(null);
                        }
                    } else {
                        detail.setDate(billDate.toString());
                    }
                    details.add(detail);
                });
                expense.setDetails(details);
                expense.setMonth(month);
                expense.setYear(year);
                expense.setExpenseDate(billDate);
                expenses.add(expense);
            });
            bill.setExpenses(expenses);

            Set<Income> incomes = new HashSet<>();
            bill.getIncomes().forEach(income -> {
                income.setMonth(month);
                income.setYear(year);
                income.setIncomeDate(billDate);
                incomes.add(income);
            });
            bill.setIncomes(incomes);

            return repository.save(bill);
        } catch (Exception ex) {
            throw new ApiException("Could not save bill", ex);
        }
    }

    public Bill get(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new NotFoundException("Could not get bill ID=" + id));
    }

    public long deleteAll() {
        try {
            long count = repository.count();
            repository.deleteAllInBatch();
            return count;
        } catch (Exception ex) {
            throw new ApiException("Could not delete all bills", ex);
        }
    }

    public String delete(Long id) {
        try {
            Bill bill = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Could not delete bill ID=" + id));
            String msg = bill.getMonth() + " - " + bill.getYear() + " successfully deleted";
            repository.deleteById(id);
            return msg;
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ApiException("Could not delete bill ID=" + id, ex);
        }
    }

    public List<Bill> summary() {
        try {
            return repository.summary();
        } catch (Exception ex) {
            throw new ApiException("Could not get summary", ex);
        }
    }
}
