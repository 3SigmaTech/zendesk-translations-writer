import querystring from 'querystring';
import * as https from 'https';
import * as languages from './google-languages.js';
import * as languages_1 from './google-languages.js';
export { languages_1 as languages };
export class GoogleApp {
    constructor() {
        this.grantType = 'refresh_token';
        this.clientId = '';
        this.clientSecret = '';
        this.redirectURI = '';
        this.refreshToken = '';
    }
    isGood() {
        let missing = [];
        if (!this.clientId) {
            missing.push('clientId');
        }
        if (!this.clientSecret) {
            missing.push('clientSecret');
        }
        if (!this.redirectURI) {
            missing.push('redirectURI');
        }
        if (!this.refreshToken) {
            missing.push('refreshToken');
        }
        if (missing.length > 0) {
            console.error(`Your Google App is misconfigured. You are missing: ${missing.join(', ')}`);
            return false;
        }
        return true;
    }
    clientId;
    clientSecret;
    grantType;
    redirectURI;
    refreshToken;
}
export class Translator {
    constructor(googleApp) {
        this.gApp = googleApp;
    }
    gApp;
    async translate(text, opts) {
        opts = opts || {};
        [opts.from, opts.to].forEach(function (lang) {
            if (lang && !languages.isSupported(lang)) {
                let e = new Error('The language \'' + lang + '\' is not supported');
                return new Promise(function (resolve, reject) {
                    reject(e);
                });
            }
        });
        let from = languages.getCode((opts.from || 'auto'));
        let to = languages.getCode((opts.to || 'en'));
        if (opts.from != from) {
            console.log(`Using code ${from} for ${opts.from} for source language.`);
        }
        if (opts.to != to) {
            console.log(`Using code ${to} for ${opts.to} for destination language.`);
        }
        if (!Array.isArray(text)) {
            text = [text];
        }
        const tokendata = await this.#refreshToken();
        let options = {
            method: 'POST',
            host: 'translation.googleapis.com',
            path: '/language/translate/v2',
            headers: {
                'Authorization': 'Bearer ' + tokendata.access_token
            }
        };
        let post_data = {
            "q": text,
            "target": to,
            "source": from
        };
        try {
            return await new Promise(function (resolve, reject) {
                const req = https.request(options, (response) => {
                    let datastr = '';
                    response.on('data', (chunk) => {
                        datastr = datastr + chunk.toString();
                    });
                    response.on('end', () => {
                        let data = JSON.parse(datastr);
                        if (Translator.#isSuccess(data)) {
                            resolve(data.data.translations);
                        }
                        else {
                            console.error(`ERROR IN POST: ${post_data}`);
                            reject(data.error);
                        }
                    });
                });
                req.on('error', (err) => { Translator.#errHandler(err, reject); });
                req.write(JSON.stringify(post_data));
                req.end();
            });
        }
        catch (err) {
            throw new Error(`${err}`);
        }
    }
    #refreshToken() {
        let postdata = querystring.stringify({
            'client_id': this.gApp.clientId,
            'client_secret': this.gApp.clientSecret,
            'grant_type': this.gApp.grantType,
            'redirect_uri': this.gApp.redirectURI,
            'refresh_token': this.gApp.refreshToken
        });
        var options = {
            method: 'POST',
            host: 'oauth2.googleapis.com',
            path: '/token',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postdata)
            }
        };
        return new Promise((resolve, reject) => {
            if (!this.gApp.isGood()) {
                reject("Bad Google App Configuration - we will not update translations.");
                return;
            }
            const req = https.request(options, (res) => {
                res.setEncoding('utf8');
                let datastr = '';
                res.on('data', (data) => {
                    datastr += data;
                });
                res.on('end', () => {
                    let data = JSON.parse(datastr);
                    if (Translator.#isSuccess(data)) {
                        resolve(data);
                    }
                    else {
                        reject(data);
                    }
                });
            });
            req.on('error', (err) => { Translator.#errHandler(err, reject); });
            req.write(postdata);
            req.end();
        });
    }
    ;
    static #isSuccess(data) {
        if (data?.error?.message) {
            console.error('Error in Google: ' + data.error.message);
            return false;
        }
        else if (data?.error_description) {
            console.error('Error in Google: ' + data.error_description + ' ' + data.error);
            return false;
        }
        else if (data?.error) {
            console.error('Error in Google: ' + data.error);
            return false;
        }
        return true;
    }
    ;
    static #errHandler(err, reject) {
        if (err?.errno == -54) {
            // do nothing - google apis do this to end the feed (I think)
        }
        else {
            console.error('error: ' + err.message);
            console.error(err);
            reject(err);
        }
    }
}
