package org.billmanager.api.bill;

import javax.transaction.Transactional;

import org.springframework.data.repository.PagingAndSortingRepository;

@Transactional
public interface BillRepository extends PagingAndSortingRepository<Bill, Long> {

}