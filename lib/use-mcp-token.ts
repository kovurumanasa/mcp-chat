import { useMsal } from "@azure/msal-react";
import { useCallback } from "react";

export function useMcpToken(scopes: string[] = ["User.Read"]) {
  const { instance, accounts } = useMsal();

  const getToken = useCallback(async () => {
    if (accounts.length === 0) throw new Error("User not logged in");
    const response = await instance.acquireTokenSilent({
      account: accounts[0],
      scopes,
    });
    return response.accessToken;
  }, [instance, accounts, scopes]);

  return getToken;
}
