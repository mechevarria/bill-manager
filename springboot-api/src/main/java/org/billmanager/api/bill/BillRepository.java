package org.billmanager.api.bill;

import java.util.List;

import javax.transaction.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.PagingAndSortingRepository;

@Transactional
public interface BillRepository extends PagingAndSortingRepository<Bill, Long> {
    String query = "select new Bill(" +
        "b.id, b.billDate, b.month, b.year, b.totalExpense, b.totalIncome, " +
        "b.owner1Income, b.owner2Income, b.owner1Personal, b.owner2Personal, " +
        "b.owner1Owe, b.owner2Owe, b.lastUpdated" +
        ") from Bill b";

    @Query(query)
    public List<Bill> summary();

    @Query(query)
    public Page<Bill> summary(Pageable Pageable);
}