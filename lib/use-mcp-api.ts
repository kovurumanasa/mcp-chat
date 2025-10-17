import { useMsal } from "@azure/msal-react";

export async function callMcpApi({
  apiUrl,
  body,
  scopes = ["User.Read"],
}: {
  apiUrl: string;
  body: Record<string, any>;
  scopes?: string[];
}) {
  const { instance, accounts } = useMsal();
  if (accounts.length === 0) throw new Error("User not logged in");

  // Acquire token from MSAL
  const response = await instance.acquireTokenSilent({
    account: accounts[0],
    scopes,
  });
  const token = response.accessToken;

  // Call your API route, passing the token in the body
  const apiResponse = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...body, token }),
  });

  if (!apiResponse.ok) throw new Error("MCP API request failed");
  return await apiResponse.json();
}
