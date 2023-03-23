
export type Translations = {
    [key: string]: AppTranslation;
}

export type AppTranslation = {
    app?: AppDetails;
    default: TranslationDefaults;
}

export type AppDetails = {
    name: string;
    short_description: string;
    long_description: string;
    installation_instructions: string;
    parameters?: {
        [key: string]: DocumentedParameter
    }
    [key: string]: string;
};
export type TranslationDefaults = {
    [key: string]: string;
};

export type DocumentedParameter = {
    label: string,
    helpText: string
}
export type AppParameter = {
    name: string;
    type: string;
    required: boolean;
    secure: boolean;
    default: string | boolean | number;
};

export type AppManifest = {
    name?: string;
    author: {
        name: string;
        email: string;
        url: string;
        [key: string]: any;
    };
    version?: string;
    frameworkVersion?: string;
    location?: {
        support?: {
            [key: string]: string | { url: string, flexible: boolean }
        };
        chat?: {
            [key: string]: string | { url: string, flexible: boolean }
        };
        sell?: {
            [key: string]: string | { url: string, flexible: boolean }
        };
    };
    gaID?: string;
    defaultLocale?: string;
    parameters?: AppParameter[],
    domainWhitelist?: string[];
    private?: boolean;
    requirementsOnly?: boolean;
    singleInstall?: boolean;
    signedUrls?: boolean;
    termsConditionsURL?: string;
    experiments?: { hasParams: boolean; }
    marketingOnly?: boolean;
    oauth?: {
        client_id: string;
        client_secret: string;
        authorize_uri: string;
        access_token_uri: string;
        scope?: string;
    };
    [key: string]: any;
}



export type TranslateOptions = {
    from: string;
    to: string;
}

export type GoogleError = {
    code?: string;
    errno?: number;
    syscall?: string;
    message?: string;
    stack?: string;
};

export type GoogleToken = {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
};

export type Translation = {
    translatedText: string;
}
