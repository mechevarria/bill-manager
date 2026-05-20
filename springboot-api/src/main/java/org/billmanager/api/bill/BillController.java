package org.billmanager.api.bill;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BillController {

    @Autowired
    BillService billService;

    @GetMapping("/bill")
    public Map<String, Object> getAll(@RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "0") int start,
            @RequestParam(defaultValue = "billDate") String sort,
            @RequestParam(defaultValue = "desc") String order) {
        return billService.getAll(size, start, sort, order);
    }

    @GetMapping("/summary")
    public List<Bill> summary() {
        return billService.summary();
    }

    @PostMapping("/bill")
    public Bill save(@RequestBody Bill bill) {
        // POST creates a new bill: strip IDs from the bill and all children so
        // imported / template payloads can't accidentally merge into existing rows.
        bill.setId(0L);
        bill.getExpenses().forEach(e -> {
            e.setId(0L);
            if (e.getDetails() != null) {
                e.getDetails().forEach(d -> d.setId(0L));
            }
        });
        bill.getIncomes().forEach(i -> i.setId(0L));
        return billService.save(bill);
    }

    @DeleteMapping("/bill")
    public Map<String, Object> deleteAll() {
        long count = billService.deleteAll();
        return Map.of("text", count + " bill(s) deleted", "count", count);
    }

    @PutMapping("/bill/{id}")
    public Bill update(@RequestBody Bill bill, @PathVariable String id) {
        bill.getExpenses().forEach(e -> {
            if (e.getDetails() != null) {
                e.getDetails().forEach(d -> d.setId(0L));
            }
        });
        return billService.save(bill);
    }

    @GetMapping("/bill/{id}")
    public Bill get(@PathVariable Long id) {
        return billService.get(id);
    }

    @DeleteMapping("/bill/{id}")
    public Map<String, String> delete(@PathVariable Long id) {
        return Map.of("text", billService.delete(id));
    }
}
