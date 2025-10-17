import React from "react";
import { BrowserCacheLocation, LogLevel, PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
// const isIE = window.navigator.userAgent.indexOf('MSIE ') > -1 || window.navigator.userAgent.indexOf('Trident/') > -1;

// Replace with your Azure AD app/client ID and authority
const msalConfig = {
    auth: {
        clientId: "7315ee12-b050-4128-96dd-fdffcbbebbb8", // TODO: Replace with your Azure AD app's clientId
        authority: "https://login.microsoftonline.com/eb70b763-b6d7-4486-8555-8831709a784e", // TODO: Replace with your tenant ID
        knownAuthorities: ['login.microsoftonline.com'],
        redirectUri: 'https://localhost:4200', // TODO: Replace with your redirect URI
        // postLogoutRedirectUri: window.location.origin + '/'
    },
    cache: {
          cacheLocation: BrowserCacheLocation.LocalStorage,
          // storeAuthStateInCookie: isIE,
        },
        system: {
          loggerOptions: {
            // loggerCallback: () => { }, // In case it need then can uncomment
            logLevel: LogLevel.Info,
            piiLoggingEnabled: false
          }
        }
};

const msalInstance = new PublicClientApplication(msalConfig);

export function AzureMsalProvider({ children }: { children: React.ReactNode }) {
    return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}
