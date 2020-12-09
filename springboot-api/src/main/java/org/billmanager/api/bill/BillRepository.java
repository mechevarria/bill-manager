package org.billmanager.api.bill;

import java.util.List;

import javax.transaction.Transactional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.PagingAndSortingRepository;

@Transactional
public interface BillRepository extends PagingAndSortingRepository<Bill, Long> {
    @Query("select b.id, b.billDate, b.year, b.totalExpense, b.totalIncome from Bill b")
    public List<Bill> summary();
}