package org.billdb.api.defaults;

import org.billdb.api.PersistenceManager;

import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.logging.Logger;

public class DefaultsService {

    private static final Logger logger = Logger.getLogger(DefaultsService.class.getName());

    EntityManager em = PersistenceManager.openEntityManager();

    private DefaultsModel getSampleDefaults() {
        DefaultsModel defaults = new DefaultsModel();
        Set<Owner> owners = new HashSet<>();

        Owner owner1 = new Owner();
        owner1.setName("owner1");
        owner1.setLabel("owner1");
        owner1.setColor("info");
        owner1.setDefaults(defaults);
        owners.add(owner1);

        Owner owner2 = new Owner();
        owner2.setName("owner2");
        owner2.setLabel("owner2");
        owner2.setColor("danger");
        owner2.setDefaults(defaults);
        owners.add(owner2);

        defaults.setOwners(owners);

        return defaults;
    }

    public DefaultsModel getDefaults() {
        TypedQuery<DefaultsModel> query = em.createQuery("SELECT i FROM DefaultsModel i", DefaultsModel.class);

        List<DefaultsModel> list = query.setMaxResults(1).getResultList();

        DefaultsModel defaults;

        if (list.size() < 1) {
            logger.info("Creating sample defaults model");

            defaults = getSampleDefaults();

            em.getTransaction().begin();

            em.persist(defaults);
            em.flush();

            em.getTransaction().commit();
            em.close();
        } else {
            defaults = list.get(0);
        }

        return defaults;
    }

    public DefaultsModel updateDefaults(DefaultsModel defaults) {

        em.getTransaction().begin();

        DefaultsModel updated = em.merge(defaults);

        em.getTransaction().commit();
        em.close();

        return updated;

    }
}
