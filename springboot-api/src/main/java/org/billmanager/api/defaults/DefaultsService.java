package org.billmanager.api.defaults;

import java.util.HashSet;
import java.util.Set;

import org.billmanager.api.ApiException;
import org.billmanager.api.NotFoundException;
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
        Long defaultsId = repository.findId();
        if (defaultsId == null) {
            logger.info("No defaults row found, seeding new one");
            return getNew();
        }
        return repository.findById(defaultsId).orElseGet(this::getNew);
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
            return repository.save(defaults);
        } catch (Exception ex) {
            throw new ApiException("Could not seed system defaults", ex);
        }
    }

    public Defaults update(Defaults defaults) {
        try {
            repository.findById(defaults.getId())
                .orElseThrow(() -> new NotFoundException("Defaults ID=" + defaults.getId() + " not found"));
            return repository.save(defaults);
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ApiException("Could not update system defaults", ex);
        }
    }
}
