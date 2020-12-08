package org.billmanager.api.defaults;

import java.util.HashSet;
import java.util.Set;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.TypedQuery;
import javax.transaction.Transactional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;
import org.springframework.stereotype.Service;

@Service
@Repository
@Transactional
public class DefaultsService {
    private static final Logger logger = LoggerFactory.getLogger(DefaultsService.class);

    @PersistenceContext
    private EntityManager em;

    public Defaults get() {
        try {
            Long defaultsId = em.createQuery("select d.id from Defaults d", Long.class).getSingleResult();
            Defaults defaults = em.find(Defaults.class, defaultsId);
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
            em.persist(defaults);
            return defaults;
        } catch (Exception ex) {
            logger.error(ex.getMessage(), ex);
            return null;
        }
    }

    public Defaults update(Defaults defaults) {
        try {
            Defaults existing = em.find(Defaults.class, defaults.getId());
            existing = em.merge(defaults);
            em.flush();
            return existing;
        } catch (Exception ex) {
            logger.error(ex.getMessage(), ex);
            return null;
        }
    }
}
