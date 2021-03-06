package org.billmanager.api.defaults;

import java.util.HashSet;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DefaultsService {
    private static final Logger logger = LoggerFactory.getLogger(DefaultsService.class);

    @Autowired
    private DefaultsRepository repository;

    public Defaults get() {
        try {
            Long defaultsId = repository.findId();
            Defaults defaults = repository.findById(defaultsId).get();
            return defaults;
        } catch (Exception ex) {
            logger.warn(ex.getMessage());
            return getNew();
        }
    }

    public Defaults getNew() {

        Owner owner1 = new Owner();
        owner1.setName("owner1");
        owner1.setLabel("owner1");
        owner1.setColor("info");

        Owner owner2 = new Owner();
        owner2.setName("owner2");
        owner2.setLabel("owner2");
        owner2.setColor("danger");

        Set<Owner> owners = new HashSet<>();
        owners.add(owner1);
        owners.add(owner2);
        Defaults defaults = new Defaults();
        defaults.setOwners(owners);

        try {
            repository.save(defaults);
            return defaults;
        } catch (Exception ex) {
            logger.error(ex.getMessage(), ex);
            return null;
        }
    }

    public Defaults update(Defaults defaults) {
        try {
            // make sure we do not insert a new record
            repository.findById(defaults.getId()).get();
            defaults = repository.save(defaults);
            return defaults;
        } catch (Exception ex) {
            logger.error(ex.getMessage(), ex);
            return null;
        }
    }
}
