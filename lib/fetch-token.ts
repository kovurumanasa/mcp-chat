// Generic function to fetch an authentication token from an API
// Adjust the URL and request body as needed for your backend

export async function fetchAuthToken() {
  const response = await fetch('https://api.example.com/auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'your-username',
      password: 'your-password',
      // Add other required fields here
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch token');
  }

  const data = await response.json();
  // Adjust this if your token is in a different field
  return data.access_token;
}
