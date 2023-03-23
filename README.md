# Overview
This package will allow you to write your Zendesk manifest from a Readme file. This makes reviewing layout, spelling, and grammar much easier (since it isn't all in one long JSON string). This package also includes the ability to automatically update your translations files (and make them available in an importable JS file) from [Google's Translate API](https://cloud.google.com/translate).

To see how this works, check out the [Zendesk Awesomeness App](https://github.com/3SigmaTech/zen-awesomeness). The app doesn't do anything meaningful, but it does show how to leverage this package in your build process (and automate the compilation of a Zendesk App using NPM scripts).

# Setup
You will need four environment variables, or you will need to pass these values in as command line arguments *in the order they are listed*.
* GOOGLE_CLIENT_ID - Client ID for Google OAuth App
* GOOGLE_CLIENT_SECRET - Client Secret for Google OAuth App
* GOOGLE_REDIRECT_URI - Redirect URI used to generate below refresh token
* GOOGLE_REFRESH_TOKEN - Refresh Token with **https://www.googleapis.com/auth/cloud-translation** scope. Note: when retrieving an authorization code, pass in **access_type=offline** to get a refresh token.

# Use
Once you install the package in your app development project, `npm i -D zendesk-translations-writer`, you can use it in your build process. For example, here we define a `translate` script and call it as part of our build:
```json
"scripts": {
    "translate": "zendesk-translations-writer",
    "build": "npm run translate && rollup -c"
}
```

In order for this package to work right[^todo-config] you will need:

* A `src/` directory where `translations.js` will be saved.
* A `translations/` directory with JSON files for each locale you want to support. (They can be blank to start.)
* A `translations/en.json` file with the `defaults` section populated with the default translations.[^todo-config]
* A `manifest.json` file
* A `README.md` file

The `translations.js` file exports all of the "default" values from your assorted translations JSON files. For example, given two defaults in the `en.json` file and a `de.json` file, this package will get the German translations from the Google Translate API, update the `de.json` accordingly, and create a `translations.js` file similar to:
```javascript
export const translations = {
    "de": {
        "default": {
            "awesome": "Eindrucksvoll",
            "rateyour": "Bewerten Sie Ihr tolles"
        }
    },
    "en": {
        "default": {
            "awesome": "Awesome",
            "rateyour": "Rate your awesome"
        }
    }
};
```

# The Readme File Format
You will want to have the following sections in your readme file:
* Name
* Short Description
* Long Description
* Installation Instructions

These are well documented [here](https://developer.zendesk.com/documentation/marketplace/building-a-marketplace-app/create-content/).

In the *Installation Instructions* section I recommend documenting your parameters as well (at least, for the purposes of this package, it is otherwise optional). Parameters will be documented under a *Configuration Options* subsection (proceeded with two hash-marks). Within this subsection you will document your parameters thusly:
```
<!-- parameter_name -->
* **Label**: Help Text
<!-- other_parameter_name -->
* **Other Label**: Other Help Text
.
.
.
```

## Manifest updates

You can have optional sections for:
* Author - this section is described below
* TermsConditionsURL - this section would only have the URL (not formatted as a link using markdown).

These will update the `manifest.json` file.[^todo-manifest] The author section is special and should be formatted thusly:
```
# Author
Name: {{author's name}}
Email: {{author's email}}
URL: {{author's url}}
```


[^todo-config]: At least until I update it to allow more robust configuration, such as setting file locations and the default locale.
[^todo-manifest]: It is an outstanding TODO to expand this package to support a complete generation of the manifest from the readme file.