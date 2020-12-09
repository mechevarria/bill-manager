package org.billmanager.api.bill;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    @Autowired
    private BillRepository repository;

    public Map<String, Object> getAll(int size, int start, String sortField, String order) {
        try {
            Sort sort = Sort.by(sortField);
            if(order.equalsIgnoreCase("desc")) {
                logger.info("order=" + order + " is descending");
                sort = sort.descending();
            } else {
                logger.info("order=" + order + " is ascending");
                sort = sort.ascending();
            }
            Pageable pageable = PageRequest.of(start, size, sort);
            Page<Bill> page = repository.findAll(pageable);
            List<Bill> bills = page.getContent();
            long count = page.getTotalElements();

            Map<String, Object> results = new HashMap<>();
            results.put("bills", bills);
            results.put("count", count);

            return results;

        } catch (Exception ex) {
            logger.error(ex.getMessage(), ex);
            return null;
        }
    }

    public Bill save(Bill bill) {
        try {
            bill = repository.save(bill);
            return bill;
        } catch (Exception ex) {
            logger.error(ex.getMessage(), ex);
            return null;
        }
    }

    public String delete(Long id) {
        try {
            Bill bill = repository.findById(id).get();
            String msg = bill.getMonth() + " - " + bill.getYear() + " successfully deleted";
            repository.deleteById(id);
            return msg;
        } catch (Exception ex) {
            logger.error(ex.getMessage(), ex);
            return null;
        }
    }
}