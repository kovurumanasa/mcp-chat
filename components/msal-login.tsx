import React from "react";
import { useMsal } from "@azure/msal-react";

export function MsalLogin() {
  const { instance, accounts } = useMsal();

  // Login handler
  const handleLogin = () => {
    instance.loginPopup(); // You can use loginRedirect() for full page redirect
  };

  // Get access token for a resource (API)
  const getToken = async () => {
    if (accounts.length === 0) return null;
    const response = await instance.acquireTokenSilent({
      account: accounts[0],
      scopes: ["User.Read"], // TODO: Replace with your required scopes
    });
    return response.accessToken;
  };

  return (
    <div>
      {accounts.length === 0 ? (
        <button onClick={handleLogin}>Login with Azure AD</button>
      ) : (
        <span>Logged in as: {accounts[0].username}</span>
      )}
    </div>
  );
}
