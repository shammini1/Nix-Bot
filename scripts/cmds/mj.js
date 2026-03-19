const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");
const { fetchImage } = global.utils;

module.exports = {
  config: {
    name: "midjourney",
    aliases: ["mj"],
    version: "0.1.0",
    author: "Christus",
    countDown: 10,
    role: 0,
    description: {
      en: "Generate AI images in Midjourney style with grid and reply selection"
    },
    category: "ai",
    guide: {
      en: "{pn} <prompt>"
    }
  },

  onStart: async function ({ sock, chatId, args, event, senderId, reply }) {
    const prompt = args.join(" ");
    if (!prompt) return reply("Please provide a prompt.");

    const wait = await sock.sendMessage(chatId, { text: "🎨 Generating your 4 Midjourney images, please wait..." }, { quoted: event });

    const tmpDir = path.join(__dirname, "cache");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    try {
      const baseApi = "https://azadx69x-all-apis-top.vercel.app/api/mj";
      const response = await axios.get(`${baseApi}?prompt=${encodeURIComponent(prompt)}`);
      const result = response.data;

      if (!result.success || !result.data?.images?.length) {
        throw new Error("API did not return any images.");
      }

      const imageUrls = result.data.images.slice(0, 4);
      const buffers = [];

      for (const url of imageUrls) {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        buffers.push(Buffer.from(res.data));
      }

      const canvas = createCanvas(1024, 1024);
      const ctx = canvas.getContext("2d");
      const images = await Promise.all(buffers.map(b => loadImage(b)));

      ctx.drawImage(images[0], 0, 0, 512, 512);
      ctx.drawImage(images[1], 512, 0, 512, 512);
      ctx.drawImage(images[2], 0, 512, 512, 512);
      ctx.drawImage(images[3], 512, 512, 512, 512);

      const gridBuffer = canvas.toBuffer("image/png");
      const gridPath = path.join(tmpDir, `mj_grid_${Date.now()}.png`);
      fs.writeFileSync(gridPath, gridBuffer);

      const sentMsg = await sock.sendMessage(chatId, {
        image: fs.readFileSync(gridPath),
        caption: `🎨 *Midjourney Image Grid*\n\n📝 *Prompt:* ${prompt}\n\n✨ _Reply with a number (1-4) to get the full quality individual image._`
      }, { quoted: event });

      if (!global.NixBot.onReply) global.NixBot.onReply = [];
      global.NixBot.onReply.push({
        commandName: "midjourney",
        messageID: sentMsg.key.id,
        author: senderId,
        buffers: buffers,
        prompt: prompt
      });

      try { await sock.sendMessage(chatId, { delete: wait.key }); } catch (e) {}
      fs.unlinkSync(gridPath);

    } catch (e) {
      console.error("[MIDJOURNEY] Error:", e.message);
      try { await sock.sendMessage(chatId, { delete: wait.key }); } catch (err) {}
      reply("❌ Error generating images: " + e.message);
    }
  },

  onReply: async function ({ sock, chatId, message, senderId, event, reply }) {
    const contextInfo = event.message?.extendedTextMessage?.contextInfo;
    const repliedMsgId = contextInfo?.stanzaId;
    if (!repliedMsgId) return;

    const dataIndex = global.NixBot.onReply.findIndex(r => r.commandName === "midjourney" && r.messageID === repliedMsgId && r.author === senderId);
    if (dataIndex === -1) return;

    const data = global.NixBot.onReply[dataIndex];
    const text = (message.message?.conversation || message.message?.extendedTextMessage?.text || "").trim();
    const num = parseInt(text);

    if (isNaN(num) || num < 1 || num > 4) {
      return reply("❌ Please reply with a valid number between 1 and 4.");
    }

    const selectedBuffer = data.buffers[num - 1];
    if (!selectedBuffer) return;

    try {
      await sock.sendMessage(chatId, {
        image: selectedBuffer,
        caption: `🎨 *Midjourney - Image ${num}/4*\n\n📝 *Prompt:* ${data.prompt}`
      }, { quoted: event });
    } catch (e) {
      console.error("[MJ REPLY] Error:", e.message);
      reply("❌ Failed to send the selected image.");
    }
  }
};
