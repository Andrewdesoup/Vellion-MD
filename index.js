const { default: makeWASocket, DisconnectReason, useSingleFileAuthState, fetchLatestBaileysVersion } = require('@adiwajshing/baileys');
const { Boom } = require('@hapi/boom');

// Authentication file to store session
let state, saveState;
try {
  const auth = require('@adiwajshing/baileys').useSingleFileAuthState('./auth_info.json');
  state = auth.state;
  saveState = auth.saveState;
} catch (error) {
  console.error('Failed to initialize useSingleFileAuthState. Ensure you are using the correct version of @adiwajshing/baileys.');
  process.exit(1);
}

// Social Group Links and Owner Info
const socialLinks = {
  whatsappGroup: 'https://chat.whatsapp.com/Lfdo2Q3RhM2GVAmgNXA1dc',
};
const ownerName = '𓄀Andrewฅʕ•̫͡•ʔฅ𒐫𖤍𒐫𖤍𒐫𖤍𒐫𖤍𒐫𖤍𒐫𖤍𒐫𖤍𒐫𖤍';

// Start Bot
async function startBot() {
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`Using Baileys v${version}, is latest: ${isLatest}`);

  const sock = makeWASocket({
    version,
    auth: state,
  });

  // Save authentication state
  sock.ev.on('creds.update', saveState);

  // Handle connection updates
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed. Reconnecting...', shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('Connected to WhatsApp!');
    }
  });

  // Handle incoming messages
  sock.ev.on('messages.upsert', async (msgUpdate) => {
    const message = msgUpdate.messages[0];
    if (!message.message) return;

    const from = message.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = isGroup ? message.key.participant : from;
    const text = message.message.conversation || message.message.extendedTextMessage?.text;

    // Get group metadata
    const groupMetadata = isGroup ? await sock.groupMetadata(from) : null;
    const isAdmin = isGroup && groupMetadata.participants.some((p) => p.id === sender && p.admin);

    // Handle commands
    if (text === '!menu') {
      const menu = `
Hello, *${ownerName}*! Here's what I can do:
1. *!antilink [on/off]* - Anti-link protection.
2. *!tagall* - Tag everyone in the group.
3. *!kick [@member]* - Remove a member.
4. *!media* - Media commands.
5. *!social* - Get social links.
6. *!statusview* - View and save statuses.
7. *!chatgpt [query]* - Ask ChatGPT (AI-powered bot).
8. *!viewonce* - Download view-once media.
9. *!deleted* - Retrieve deleted messages.
10. *!download [url]* - Download music, videos, or images.

*Join our group*: ${socialLinks.whatsappGroup}
      `;
      await sock.sendMessage(from, { text: menu });
    }
    // Add other commands and features here...
  });
}

// Run the bot
startBot().catch((err) => console.error(err));
