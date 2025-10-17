import React, { createContext, useContext, useEffect, useState } from "react";
import { useMsal, useAccount, useMsalAuthentication } from "@azure/msal-react";
// Context to provide MSAL authentication state and token
const AuthContext = createContext({
  isAuthenticated: false,
  accessToken: null,
  login: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
import { BrowserCacheLocation, LogLevel, PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
// const isIE = window.navigator.userAgent.indexOf('MSIE ') > -1 || window.navigator.userAgent.indexOf('Trident/') > -1;

// Replace with your Azure AD app/client ID and authority
const msalConfig = {
     auth: {
        clientId: `${process.env.NEXT_PUBLIC_AZURE_CLIENT_ID}`, // TODO: Replace with your Azure AD app's clientId
        authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID}`, // TODO: Replace with your tenant ID
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
  return (
    <MsalProvider instance={msalInstance}>
      <MsalAuthProvider>{children}</MsalAuthProvider>
    </MsalProvider>
  );
}

function MsalAuthProvider({ children }: { children: React.ReactNode }) {
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const isAuthenticated = !!account;

  // Acquire token silently or interactively
  useEffect(() => {
    async function getToken() {
      if (!account) {
        setAccessToken(null);
        return;
      }
      try {
        const response = await instance.acquireTokenSilent({
          account,
          scopes: ["user.read"], // TODO: Use required scopes for MCP
        });
        setAccessToken(response.accessToken);
      } catch (e) {
        setAccessToken(null);
      }
    }
    getToken();
  }, [account, instance]);

  // Login and logout helpers
  const login = () => instance.loginRedirect({ scopes: ["user.read"] });
  const logout = () => instance.logoutRedirect();

  return (
    <AuthContext.Provider value={{ isAuthenticated, accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
