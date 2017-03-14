package org.billdb.api;

import io.undertow.Undertow;
import org.jboss.resteasy.plugins.server.undertow.UndertowJaxrsServer;

import java.util.logging.Logger;

public class RestServer {

    private static final Logger logger = Logger.getLogger(RestServer.class.getName());

    public static void main( String[] args ) {

        UndertowJaxrsServer ut = new UndertowJaxrsServer();

        RestApplication ta = new RestApplication();

        ut.deploy(ta);

        Long start = System.currentTimeMillis();
        ut.start(
                Undertow.builder()
                        .addHttpListener(8081, "0.0.0.0")

        );

        Long end = System.currentTimeMillis();
        Long total = end - start;
        logger.info("server started in " + total + "ms");
    }
}
