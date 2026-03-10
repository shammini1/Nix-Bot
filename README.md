<p align="center">
  <h1 align="center">NixBot</h1>
  <p align="center">A powerful WhatsApp group management bot built with Baileys</p>
  <p align="center">
    <a href="https://wa.me/+8801903910486">WhatsApp</a> &bull;
    <a href="https://fb.com/100001611578438">Facebook</a> &bull;
    <a href="https://t.me/@aryannix">Telegram</a> &bull;
    <a href="https://ig.com/aryan_rayhan_07">Instagram</a>
  </p>
</p>

---

## What is NixBot?

NixBot is a feature-rich WhatsApp bot powered by [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys). It supports 55+ commands across AI, media, group management, games, and utilities. Fully modular — add, remove, or customize commands without touching core files.

### Highlights

- Multi-device WhatsApp (QR / Pairing Code)
- 55+ modular commands with hot-reload
- AI integration (Gemini, Baby AI chatbot)
- YouTube video & music downloads
- Image tools (4K upscale, background removal, Midjourney)
- Group management (ban, kick, antilink, welcome/leave)
- Economy & games (quiz, flag game, slots, daily rewards)
- Per-group aliases, shortcuts, and custom rules
- Role-based access (User → Admin → Developer)
- SQLite / MongoDB database support
- Auto-restart & memory optimization

---

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Configure

Edit `config.json`:

```json
{
  "prefix": "!",
  "botName": "NixBot",
  "ownerNumber": ["your_number_here"],
  "loginMethod": "paircode"
}
```

### 3. Get Pairing Code

Get your 8-digit pairing code from:

**[https://paircode-quwu.onrender.com/](https://paircode-quwu.onrender.com/)**

Or the bot will show a pairing code in the console automatically.

Then open WhatsApp → Settings → Linked Devices → Link a Device → Enter the code.

### 4. Run

```bash
node index.js
```

---

## Project Structure

```
NixBot/
├── index.js               # Process supervisor (auto-restart)
├── main.js                # WhatsApp connection & pairing code auth
├── main_handler.js        # Message router & command loader
├── utils.js               # Global utilities, API config, helpers
├── config.json            # All bot settings & API keys
│
├── bot/
│   └── push.js            # Command executor, alias resolver, cooldowns
│
├── scripts/
│   ├── cmds/              # All command modules (55+)
│   │   ├── gemini.js      # AI commands
│   │   ├── video.js       # Media commands
│   │   ├── ban.js         # Group management
│   │   ├── flag.js        # Game commands
│   │   └── ...
│   └── events/            # Event handlers
│       ├── welcome.js     # Member join notifications
│       ├── leave.js       # Member leave/kick notifications
│       └── logsbot.js     # Admin log events
│
├── database/
│   ├── manager.js         # Database layer (SQLite / MongoDB)
│   └── data/              # Stored data files
│
└── session/               # WhatsApp auth credentials
```

---

## Featured Commands

Here are 10 popular commands — the bot has 55+ total. Use `!help` in chat to see all.

| Command | What it does |
|---------|-------------|
| `!gemini` | Ask Google Gemini AI anything (supports image analysis) |
| `!baby` | AI chatbot — teach it custom responses, edit, remove |
| `!video` | Download YouTube videos by name or link |
| `!sing` | Download music from YouTube as audio |
| `!4k` | Upscale any image to 4K resolution |
| `!ban` | Ban a user from group — auto-kicks if they're re-added |
| `!flag` | Guess the country from a flag image, win $50 coins |
| `!ss` | Take a screenshot of any website |
| `!weather` | Get current weather for any city |
| `!emojimix` | Combine two emojis into a new one |

---

## How to Create a Command

Every command is a single `.js` file inside `scripts/cmds/`. Drop it in and restart — NixBot loads it automatically.

### Basic Command Example

A simple command that replies with a greeting and shows the user's name:

```js
module.exports = {
  config: {
    name: "greet",
    aliases: ["hi", "hello"],
    version: "0.0.1",
    author: "ArYAN",
    role: 0,
    countDown: 5,
    category: "fun",
    description: "Send a greeting message",
    guide: {
      en: "{pn} - Bot will greet you\n{pn} <name> - Bot will greet with custom name"
    }
  },

  onStart: async function ({ sock, chatId, event, args, reply }) {
    const name = args.join(" ") || event.pushName || "friend";
    await sock.sendMessage(chatId, {
      text: `Hello ${name}! Welcome to the chat.`,
    }, { quoted: event });
  }
};
```

### Command with Reply Listener (Game Example)

Commands can listen for user replies using `onReply`. This is useful for games, quizzes, or multi-step interactions:

```js
const axios = require("axios");
const { usersData } = global.utils;

module.exports = {
  config: {
    name: "numguess",
    version: "0.0.1",
    author: "ArYAN",
    role: 0,
    countDown: 10,
    category: "game",
    description: "Guess the secret number to win coins",
    guide: {
      en: "{pn} - Start a number guessing game"
    }
  },

  onStart: async function ({ sock, chatId, event, senderId, reply }) {
    const secret = Math.floor(Math.random() * 10) + 1;

    const sent = await sock.sendMessage(chatId, {
      text: "I'm thinking of a number between 1 and 10.\nReply with your guess!",
    }, { quoted: event });

    // Register a reply listener so onReply triggers when user replies
    global.NixBot.onReply.push({
      commandName: "numguess",
      messageID: sent.key.id,
      author: senderId,
      secret: secret
    });
  },

  onReply: async function ({ sock, chatId, message, senderId, event }) {
    // Find which game this reply belongs to
    const repliedMsgId = event.message?.extendedTextMessage?.contextInfo?.stanzaId;
    if (!repliedMsgId) return;

    const data = global.NixBot.onReply.find(
      r => r.commandName === "numguess" && r.messageID === repliedMsgId
    );
    if (!data) return;

    const guess = parseInt(
      message.message?.conversation
      || message.message?.extendedTextMessage?.text
      || ""
    );

    if (isNaN(guess)) {
      return sock.sendMessage(chatId, { text: "Please reply with a number!" }, { quoted: event });
    }

    // Remove the listener after answer
    const idx = global.NixBot.onReply.findIndex(
      r => r.commandName === "numguess" && r.messageID === data.messageID
    );
    if (idx !== -1) global.NixBot.onReply.splice(idx, 1);

    if (guess === data.secret) {
      // Give reward
      const userData = await usersData.get(senderId) || {};
      const bal = Number(userData.money) || 0;
      await usersData.set(senderId, { money: bal + 100 });

      await sock.sendMessage(chatId, {
        text: `Correct! The number was ${data.secret}.\nYou earned $100!`,
      }, { quoted: event });
    } else {
      await sock.sendMessage(chatId, {
        text: `Wrong! The number was ${data.secret}. Better luck next time!`,
      }, { quoted: event });
    }
  }
};
```

### Command with Reactions & Media

Send images, use loading reactions, and handle errors properly:

```js
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const cacheDir = path.join(__dirname, "cache");

module.exports = {
  config: {
    name: "catpic",
    version: "0.0.1",
    author: "ArYAN",
    role: 0,
    countDown: 5,
    category: "fun",
    description: "Get a random cat picture",
    guide: { en: "{pn} - Sends a random cat image" }
  },

  onStart: async function ({ sock, chatId, event, reply }) {
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    const cachePath = path.join(cacheDir, `cat_${Date.now()}.jpg`);

    try {
      // Show loading reaction
      await sock.sendMessage(chatId, { react: { text: "⏳", key: event.key } });

      // Fetch image from API
      const res = await axios.get("https://cataas.com/cat", {
        responseType: "arraybuffer",
        timeout: 15000
      });
      fs.writeFileSync(cachePath, Buffer.from(res.data));

      // Send the image
      await sock.sendMessage(chatId, {
        image: fs.readFileSync(cachePath),
        caption: "Here's a random cat for you!"
      }, { quoted: event });

      // Success reaction
      await sock.sendMessage(chatId, { react: { text: "✅", key: event.key } });

    } catch (e) {
      console.error("[CATPIC] Error:", e.message);
      await sock.sendMessage(chatId, { react: { text: "❌", key: event.key } });
      reply("Failed to fetch cat picture. Try again!");
    } finally {
      // Always clean up cache
      if (fs.existsSync(cachePath)) {
        try { fs.unlinkSync(cachePath); } catch (e) {}
      }
    }
  }
};
```

### Available Parameters in `onStart`

| Parameter | Type | Description |
|-----------|------|-------------|
| `sock` | Object | WhatsApp socket connection (Baileys) |
| `chatId` | String | Current chat or group JID |
| `event` | Object | Raw incoming message event |
| `args` | Array | Command arguments (text after command name) |
| `reply` | Function | Quick text reply: `reply("text")` |
| `prefix` | String | Current bot prefix (default `!`) |
| `senderId` | String | Sender's WhatsApp JID |
| `senderNumber` | String | Sender's phone number |
| `isGroup` | Boolean | Whether message is from a group |
| `isAdmin` | Boolean | Whether sender is a group admin |
| `isBotAdmin` | Boolean | Whether bot is a group admin |
| `commandName` | String | Name of the current command |

---

## How to Create an Event

Events are `.js` files inside `scripts/events/`. They listen to WhatsApp events like member joins, leaves, or group updates.

### Event Example — Auto-greet on Join

```js
const { threadsData } = global.utils;

module.exports = {
  config: {
    name: "autohello",
    version: "0.0.1",
    author: "ArYAN",
    description: "Auto greet when someone joins a group"
  },

  onEvent: async function ({ sock, eventData }) {
    // Only handle group participant updates
    if (eventData.type !== "group-participants.update") return;

    const { id, participants, action } = eventData.data;

    // Only trigger on member add
    if (action !== "add") return;

    // Get group name
    let groupName = "this group";
    try {
      const meta = await sock.groupMetadata(id);
      groupName = meta.subject || "this group";
    } catch (e) {}

    // Greet each new member
    for (const jid of participants) {
      const jidStr = typeof jid === "string" ? jid : jid?.id || "";
      const number = jidStr.split(":")[0].split("@")[0];

      await sock.sendMessage(id, {
        text: `Hey @${number}, welcome to ${groupName}!`,
        mentions: [jidStr]
      });
    }
  }
};
```

### Event Triggers

| `action` | When it fires |
|----------|---------------|
| `"add"` | Member joins or is added to group |
| `"remove"` | Member leaves or is kicked from group |
| `"promote"` | Member is promoted to admin |
| `"demote"` | Member is demoted from admin |

---

## Role System

| Level | Who | Can use |
|-------|-----|---------|
| 0 | Everyone | Basic commands (help, ping, games, AI, media) |
| 1 | Group Admin | Group management (kick, ban, tagall, antilink) |
| 2 | Bot Owner | Bot settings (loadconfig, notification, setrole) |
| 3 | Developer | Full access (eval, shell, restart, update) |

---

## API System

All API URLs and keys are in `config.json`. Commands access them through:

```js
// API base URLs
global.NixBot.apis.base      // Main NixHost API
global.NixBot.apis.flag      // Flag game API
global.NixBot.apis.baby      // Baby AI API
global.NixBot.apis.weather   // OpenWeatherMap
global.NixBot.apis.tenor     // Google Tenor (emoji kitchen)
global.NixBot.apis.imgbb     // ImgBB upload

// API keys
global.NixBot.keys.weather   // OpenWeatherMap key
global.NixBot.keys.imgbb     // ImgBB key
global.NixBot.keys.tenor     // Tenor API key
```

No hardcoded URLs or keys in any command file. Change once in `config.json`, applies everywhere.

---

## Database

Two backends supported — set in `config.json`:

```json
{
  "database": {
    "type": "sqlite",
    "mongoURI": ""
  }
}
```

### User Data (`usersData`)

```js
const { usersData } = global.utils;

// Get user data
const user = await usersData.get(senderId);

// Set user data
await usersData.set(senderId, {
  name: "Aryan",
  money: 500,
  exp: 100
});
```

### Group Data (`threadsData`)

```js
const { threadsData } = global.utils;

// Get group settings
const group = await threadsData.get(chatId);

// Set group settings
await threadsData.set(chatId, {
  welcomeMessage: "Welcome {userName} to {boxName}!",
  welcomeEnabled: true
});
```

---

## Pairing Code

Two ways to connect:

| Method | How |
|--------|-----|
| **Web** | Go to [paircode-quwu.onrender.com](https://paircode-quwu.onrender.com/), enter your number, get the code |
| **Console** | Set `"loginMethod": "paircode"` in config, start bot, code appears in terminal |

Then: WhatsApp → Settings → Linked Devices → Link a Device → Enter code

---

## Tips

- Use `!help` to see all available commands in chat
- Use `!help <command>` to see detailed usage for any command
- Commands auto-reload — just drop a `.js` file in `scripts/cmds/` and restart
- Group admins can customize welcome/leave messages with `!setwelcome` and `!setleave`
- Set custom command aliases per group with `!setalias`
- Use `!loadconfig` to reload `config.json` without restarting

---

## Credits

**Developer** — Aryan Rayhan
**Version** — 0.0.1
**Built with** — [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys)

[Facebook](https://fb.com/100001611578438) · [Telegram](https://t.me/@aryannix) · [WhatsApp](https://wa.me/+8801903910486) · [Instagram](https://ig.com/aryan_rayhan_07)
