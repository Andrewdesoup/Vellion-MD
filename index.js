import authHandler from './auth/authHandler.js';
import messageHandler from './events/messageHandler.js';

// Owner information
const ownerName = 'Andrew'; // Replace with your desired name
const ownerContact = '233500850221'; // Replace with your contact or identifier

// Start the bot
(async () => {
  console.log(`🤖 WhatsApp Bot is starting...`);
  console.log(`👤 Owner: ${ownerName}`);
  console.log(`📞 Contact: ${ownerContact}`);
  try {
    await authHandler(messageHandler);
    console.log('✅ Bot successfully started!');
  } catch (error) {
    console.error('❌ Failed to start the bot:', error);
    process.exit(1);
  }
})();
