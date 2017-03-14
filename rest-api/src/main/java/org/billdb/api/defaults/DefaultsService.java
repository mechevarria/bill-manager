package org.billdb.api.defaults;

import org.billdb.api.PersistenceManager;

import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;
import java.util.List;
import java.util.logging.Logger;

public class DefaultsService {

    private static final Logger logger = Logger.getLogger(DefaultsService.class.getName());

    EntityManager em = PersistenceManager.openEntityManager();

    public DefaultsModel getDefaults() {
        TypedQuery<DefaultsModel> query = em.createQuery("SELECT i FROM DefaultsModel i", DefaultsModel.class);

        List<DefaultsModel> list = query.setMaxResults(1).getResultList();

        DefaultsModel defaults;

        if(list.size() < 1) {
            logger.info("Creating new defaults model");

            defaults = new DefaultsModel();

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
        DefaultsModel updated = em.find(DefaultsModel.class, defaults.getId());

        em.getTransaction().begin();

        updated = em.merge(updated);

        em.getTransaction().commit();
        em.close();

        return updated;

    }
}
