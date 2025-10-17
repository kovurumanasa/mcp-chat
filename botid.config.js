// Vercel BotId client-side protection configuration
module.exports = {
  clientSideProtection: [
    {
      path: '/api/chats/[id]',
      method: 'POST',
    },
  ],
  developmentOptions: {
    bypass: true, // Set to true to bypass BotId protection in development
  },
};
