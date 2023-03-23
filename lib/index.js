#! /usr/bin/env node
// -*- js -*-
import * as fs from "fs";
import * as path from "path";
import { decode } from 'html-entities';
import * as googletranslate from "./google-translate.js";
// TODO: Create configurable mechanism for overriding these
const DESTINATION = "./src/translations.js";
const DEFAULT_LOCALE = "en";
const TRANSLATIONS_DIR = "./translations";
const README = "./readme.md";
const MANIFEST = "./manifest.json";
const README_KEYS = ["name", "short_description", "long_description", "installation_instructions"];
const README_MANIFEST_KEYS = ["name", "author", "termsConditionsURL"];
const MAX_LENGTHS = {
    name: 40,
    short_description: 80,
    long_desription: 3000,
    installation_instructions: 3000
};
var gtranslate;
(async function () {
    let gApp = new googletranslate.GoogleApp();
    gApp.clientId = argOrEnv(0, "GOOGLE_CLIENT_ID");
    gApp.clientSecret = argOrEnv(1, "GOOGLE_CLIENT_SECRET");
    gApp.redirectURI = argOrEnv(2, "GOOGLE_REDIRECT_URI");
    gApp.refreshToken = argOrEnv(3, "GOOGLE_REFRESH_TOKEN");
    gtranslate = new googletranslate.Translator(gApp);
    const translations = getTranslations();
    updateAppDetailsFromReadme(translations);
    updateManifestFromReadme();
    validateManifest(translations);
    // Remove app details before writing translations file
    // As these details are not read by the App itself
    delete translations[DEFAULT_LOCALE]["app"];
    const updated = checkForUpdates(translations);
    if (updated) {
        await updateTranslations(translations);
        writeTranslationsToFile(translations);
        console.log(`Translations written to ${DESTINATION}`);
    }
    else {
        console.log(`Translations up-to-date`);
    }
})();
function getReadmeSection(readme, key) {
    let newDetail = '';
    let rx = new RegExp(`# ${key.replace("_", " ")}\\n([\\s\\S]*?)\\n# `, "im");
    let matches = readme.match(rx);
    if (matches?.length && matches.length > 1) {
        newDetail = matches[1].trim().replaceAll(/<!-- .*? -->/g, '');
        let maxLen = MAX_LENGTHS[key];
        if (newDetail.length > maxLen) {
            newDetail = newDetail.slice(0, maxLen - 1);
        }
    }
    return newDetail;
}
function updateAppDetailsFromReadme(translations) {
    const readme = fs.readFileSync(README).toString();
    if (!translations?.[DEFAULT_LOCALE]?.["app"]) {
        return;
    }
    let updated = false;
    let appObj = { ...translations[DEFAULT_LOCALE]["app"] };
    for (let key of README_KEYS) {
        let newValue = getReadmeSection(readme, key);
        if (!newValue) {
            continue;
        }
        if (newValue && appObj[key] != newValue) {
            appObj[key] = newValue;
            updated = true;
        }
    }
    // TODO: Update to support parameter table so we can write parameters into manifest.json as well
    let prx = new RegExp(`## Configuration Options([\\s\\S]*?)\\n# `, "im");
    let pDocs = readme.match(prx);
    let params = translations[DEFAULT_LOCALE]["app"]["parameters"];
    if (!params) {
        params = {};
    }
    let pFound = [];
    if (pDocs?.length && pDocs.length > 1) {
        prx = new RegExp(`<!-- ([\\s\\S]*?) -->\\n\\* \\*\\*([\\s\\S]*?)\\*\\*[-:] ([\\s\\S]*?)\\n`, "g");
        let pMatches = pDocs[1].matchAll(prx);
        for (const match of pMatches) {
            let pname = match[1];
            pFound.push(pname);
            let plabel = match[2];
            let phelp = match[3];
            if (params?.[pname]) {
                if (params[pname]["label"] != plabel) {
                    params[pname]["label"] = plabel;
                    updated = true;
                }
                if (params[pname]["helpText"] != phelp) {
                    params[pname]["helpText"] = phelp;
                    updated = true;
                }
            }
            else {
                params[pname] = {
                    "label": plabel,
                    "helpText": phelp
                };
                updated = true;
            }
        }
    }
    for (const key in params) {
        if (pFound.indexOf(key) == -1) {
            delete params[key];
        }
    }
    if (updated) {
        for (let key in appObj) {
            translations[DEFAULT_LOCALE]["app"][key] = appObj[key];
        }
        const translationsString = JSON.stringify(translations[DEFAULT_LOCALE], null, 4);
        fs.writeFileSync(TRANSLATIONS_DIR + '/' + DEFAULT_LOCALE + '.json', translationsString);
    }
}
function updateManifestFromReadme() {
    const readme = fs.readFileSync(README).toString();
    let manifest = JSON.parse(fs.readFileSync(MANIFEST).toString());
    let updated = false;
    for (let key of README_MANIFEST_KEYS) {
        let newValue = getReadmeSection(readme, key);
        if (!newValue) {
            continue;
        }
        // Special handler for author section
        if (key == "author") {
            let newValues = newValue.split('\n');
            for (let val of newValues) {
                let newV = val.split(': ', 2);
                let subkey = newV[0].toLowerCase().trim();
                if (!manifest[key]) {
                    manifest[key] = { name: '', email: '', url: '' };
                }
                if (manifest[key][subkey] != newV[1].trim()) {
                    manifest[key][subkey] = newV[1].trim();
                    updated = true;
                }
            }
        }
        else {
            if (newValue && manifest[key] != newValue) {
                manifest[key] = newValue;
                updated = true;
            }
        }
    }
    if (updated) {
        const manifestString = JSON.stringify(manifest, null, 4);
        fs.writeFileSync(MANIFEST, manifestString);
        console.log("Updated manifest from Readme.");
    }
    else {
        console.log("Manifest up-to-date.");
    }
}
function validateManifest(translations) {
    const mani = JSON.parse(fs.readFileSync(MANIFEST).toString());
    const params = translations?.[DEFAULT_LOCALE]?.["app"]?.["parameters"];
    for (let index in mani["parameters"]) {
        let key = mani["parameters"][index]["name"];
        if (params?.[key] == undefined) {
            console.error("UNDOCUMENTED MANIFEST PARAMETER: " + key);
        }
    }
    for (let key in params) {
        let manip = mani["parameters"].filter((p) => { return p["name"] == key; });
        if (manip.length != 1) {
            console.error("MISSING MANIFEST PARAMETER: " + key);
        }
    }
}
function getTranslations() {
    const jsonFiles = fs
        .readdirSync(TRANSLATIONS_DIR)
        .filter((file) => path.extname(file) === ".json");
    let translations = {};
    jsonFiles.forEach((file) => {
        const fileData = fs.readFileSync(path.join(TRANSLATIONS_DIR, file));
        const filename = file.replace(".json", "").toLowerCase();
        const json = JSON.parse(fileData.toString());
        translations[filename] = json;
    });
    return translations;
}
async function updateTranslations(translations) {
    let defaults = translations[DEFAULT_LOCALE]["default"];
    let opts = { from: 'en', to: '' };
    let keys = [];
    let src = [];
    for (const str in defaults) {
        keys.push(str);
        src.push(defaults[str]);
    }
    for (const lang in translations) {
        if (lang == DEFAULT_LOCALE) {
            continue;
        }
        opts.to = lang;
        let translatedStrs;
        try {
            translatedStrs = await gtranslate.translate(src, opts);
        }
        catch (err) {
            console.error(err);
            continue;
        }
        for (let i = 0; i < keys.length; i++) {
            translations[lang]["default"][keys[i]] = decode(translatedStrs[i].translatedText);
        }
        // write out
        const translationsString = JSON.stringify(translations[lang], null, 4);
        fs.writeFileSync(TRANSLATIONS_DIR + '/' + lang + '.json', translationsString);
        console.log(`Updated translations for ${lang}.`);
    }
}
function checkForUpdates(translations) {
    if (!fs.existsSync(DESTINATION)) {
        return true;
    }
    const translationsString = JSON.stringify(translations);
    const translationsObj = `export const translations = ${translationsString};`;
    const fileData = fs.readFileSync(DESTINATION).toString();
    if (fileData == translationsObj) {
        return false;
    }
    return true;
}
function writeTranslationsToFile(translations) {
    const translationsString = JSON.stringify(translations);
    const translationsObj = `export const translations = ${translationsString};`;
    fs.writeFileSync(DESTINATION, translationsObj);
}
function argOrEnv(argNum, envKey) {
    // + 2 as 0th arg is "node" and 1st is file name
    if (process.argv.length > (argNum + 2)) {
        return process.argv[argNum + 2];
    }
    else if (process.env[envKey]) {
        return process.env[envKey] || '';
    }
    return '';
}
