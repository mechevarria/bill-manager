package org.billmanager.api.defaults;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<Object> index() {
        logger.info("Getting system defaults");
        Defaults defaults = defaultsService.get();
        if (defaults != null) {
            return ResponseEntity.ok().body(defaults);
        } else {
            return ResponseEntity.status(500).body("Could not get system defaults");
        }
    }

    @PostMapping("/defaults")
    public ResponseEntity<Object> update(@RequestBody Defaults defaults) {
        logger.info("Updating system defaults");
        defaults = defaultsService.update(defaults);
        if (defaults != null) {
            return ResponseEntity.ok().body(defaults);
        } else {
            return ResponseEntity.status(500).body("Could not update system defaults");
        }
    }
}
