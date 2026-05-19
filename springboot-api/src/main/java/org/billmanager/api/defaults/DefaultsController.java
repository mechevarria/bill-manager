package org.billmanager.api.defaults;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DefaultsController {
    private static final Logger logger = LoggerFactory.getLogger(DefaultsController.class);

    @Autowired
    DefaultsService defaultsService;

    @GetMapping("/defaults")
    public Defaults index() {
        logger.info("Getting system defaults");
        return defaultsService.get();
    }

    @PostMapping("/defaults")
    public Defaults update(@RequestBody Defaults defaults) {
        logger.info("Updating system defaults");
        return defaultsService.update(defaults);
    }
}
