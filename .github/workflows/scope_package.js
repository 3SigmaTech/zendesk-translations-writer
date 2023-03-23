#! /usr/bin/env node
// -*- js -*-

import * as fs from "fs";
import * as path from "path";

(function() {
    fs.readFile('./package.json', 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        var result = data.replace(/"name": "zendesk-translations-writer"/g, '"name": "@3SigmaTech/zendesk-translations-writer"');

        fs.writeFile('./package.json', result, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    });
})();
