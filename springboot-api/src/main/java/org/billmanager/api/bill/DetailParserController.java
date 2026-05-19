package org.billmanager.api.bill;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.billmanager.api.ApiException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class DetailParserController {

    @Autowired
    private DetailParserService parserService;

    @PostMapping("/detail/parse")
    public List<ParsedDetail> parse(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new ApiException("Uploaded CSV is empty", null);
        }
        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)) {
            return parserService.parse(reader);
        } catch (IOException ex) {
            throw new ApiException("Could not read uploaded CSV", ex);
        }
    }
}
