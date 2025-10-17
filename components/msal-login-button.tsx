import React from "react";
import { useMsal } from "@azure/msal-react";

export function MsalLoginButton() {
  const { instance, accounts } = useMsal();
  const [token, setToken] = React.useState<string | null>(null);


  // Auto-login on mount if not logged in
  React.useEffect(() => {
    if (accounts.length === 0) {
      instance.loginRedirect();
    }
  }, [accounts, instance]);

  React.useEffect(() => {
    if (accounts.length > 0) {
      const request = {
        scopes: ["User.Read"],
        account: accounts[0],
      };
      instance
        .acquireTokenSilent(request)
        .then((response) => {
          setToken(response.accessToken);
        })
        .catch(() => {
          instance.acquireTokenRedirect(request);
        });
    }
  }, [accounts, instance]);

  // Only render content if logged in
  if (accounts.length === 0) {
    return null;
  }
  return (
    <div>
      {token ? (
        <div>
          <span>Access Token:</span>
          <pre style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>{token}</pre>
        </div>
      ) : (
        <span>Signed in as: {accounts[0].username}</span>
      )}
    </div>
  );
}
