package org.billmanager.api.defaults;

import javax.transaction.Transactional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

@Transactional
public interface DefaultsRepository extends CrudRepository<Defaults, Long> {
    @Query("SELECT d.id from Defaults d")
    public Long findId();
}