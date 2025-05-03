import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import configManager from '../utils/manageConfigs.js';
import readline from 'readline';

// Owner information
const ownerName = 'Andrew'; // Replace with your desired name
const ownerContact = '233500850221'; // Replace with your contact (WhatsApp number)

// Function to prompt the user for a WhatsApp number
async function promptUserNumber() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter your WhatsApp number (with country code, e.g., 233xxx): ', (number) => {
      rl.close();
      resolve(number.trim());
    });
  });
}

// Function to connect to WhatsApp
async function connectToWhatsApp(handleMessage) {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    syncFullHistory: false,
  });

  // Save authentication credentials
  sock.ev.on('creds.update', saveCreds);

  // Handle connection updates
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) connectToWhatsApp(handleMessage);
    } else if (connection === 'open') {
      console.log('✅ Connected to WhatsApp!');
    }
  });

  // Check for new registration
  setTimeout(async () => {
    if (!state.creds.registered) {
      console.log(`
      🚀 Welcome to Andrew's WhatsApp Bot!
      📲 Please enter your WhatsApp number to pair your account.
      👉 Example: 233500850221
      `);

      try {
        const number = await promptUserNumber();
        console.log(`🔄 Requesting a pairing code for ${number}`);

        const code = await sock.requestPairingCode(number);
        console.log(`📲 Pairing Code: ${code}`);
        console.log('👉 Enter this code on your WhatsApp app to pair your account.');

        // Save user configuration
        configManager.config.users[`${number}`] = {
          sudoList: [],
          tagAudioPath: 'tag.mp3',
          antilink: false,
          response: true,
          autoreact: false,
          prefix: '.',
          reaction: '🌹',
        };

        configManager.save();
      } catch (error) {
        console.error('❌ Error requesting pairing code:', error);
      }
    }
  }, 5000);

  // Handle incoming messages
  sock.ev.on('messages.upsert', async (msg) => handleMessage(msg, sock));

  return sock;
}

export default connectToWhatsApp;
