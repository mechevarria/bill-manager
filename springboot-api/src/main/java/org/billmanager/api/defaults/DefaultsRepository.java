package org.billmanager.api.defaults;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.transaction.annotation.Transactional;

@Transactional
public interface DefaultsRepository extends CrudRepository<Defaults, Long> {
    @Query("SELECT d.id from Defaults d")
    public long findId();
}
