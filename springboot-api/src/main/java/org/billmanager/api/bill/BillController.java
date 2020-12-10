package org.billmanager.api.bill;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BillController {

    @Autowired
    BillService billService;

    @GetMapping("/bill")
    public ResponseEntity<Object> getAll(@RequestParam(defaultValue = "10") String size,
            @RequestParam(defaultValue = "0") String start, @RequestParam(defaultValue = "billDate") String sort,
            @RequestParam(defaultValue = "desc") String order) {

        Map<String, Object> results = billService.getAll(Integer.valueOf(size), Integer.valueOf(start), sort, order);
        if (results != null) {
            return ResponseEntity.ok().body(results);
        } else {
            return ResponseEntity.status(500).body("Could not get bills");
        }
    }

    @GetMapping("/summary")
    public ResponseEntity<Object> summary() {
        List<Bill> bills = billService.summary();
        if (bills != null) {
            return ResponseEntity.ok().body(bills);
        } else {
            return ResponseEntity.status(500).body("Could not get summary");
        }
    }

    @PostMapping("/bill")
    public ResponseEntity<Object> save(@RequestBody Bill bill) {
        bill = billService.save(bill);
        if (bill != null) {
            return ResponseEntity.ok().body(bill);
        } else {
            return ResponseEntity.status(500).body("Could not save bill");
        }
    }

    @DeleteMapping("/bill/{id}")
    public ResponseEntity<Object> delete(@PathVariable String id) {
        String msg = billService.delete(Long.valueOf(id));
        if (msg != null) {
            return ResponseEntity.ok().body(msg);
        } else {
            return ResponseEntity.status(500).body("Could delete bill ID=" + id);
        }
    }
}
