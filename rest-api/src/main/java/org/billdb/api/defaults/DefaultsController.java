package org.billdb.api.defaults;

import javax.ws.rs.GET;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import java.util.logging.Logger;

@Path("/defaults")
@Produces(MediaType.APPLICATION_JSON)
public class DefaultsController {
    private static final Logger logger = Logger.getLogger(DefaultsController.class.getName());

    private DefaultsService defaultsService = new DefaultsService();

    @GET
    public DefaultsModel getDefaults() {

        DefaultsModel defaults = defaultsService.getDefaults();

        return defaults;
    }

    @PUT
    public DefaultsModel update(DefaultsModel defaults) {
        DefaultsModel updated = defaultsService.updateDefaults(defaults);

        return updated;
    }
}
