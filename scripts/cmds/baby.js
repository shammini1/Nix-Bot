const axios = require('axios');

const baseApiUrl = async () => {
    return global.NixBot.apis.baby;
};

const babyMessageIds = new Set();
const MAX_TRACKED_IDS = 500;

const trackMessageId = (id) => {
    if (!id) return;
    babyMessageIds.add(id);
    if (babyMessageIds.size > MAX_TRACKED_IDS) {
        const first = babyMessageIds.values().next().value;
        babyMessageIds.delete(first);
    }
};

module.exports = {
    config: {
        name: "bby",
        aliases: ["baby", "jan", "bot", "babu", "beby"],
        version: "1.3.0",
        author: "ArYAN",
        role: 0,
        category: "AI",
        description: "AI Chatbot - teach, reply, edit, remove",
        nixPrefix: false
    },

    onStart: async function ({ sock, chatId, args, message, event, getLang }) {
        const link = `${await baseApiUrl()}/baby`;
        const aryan = args.join(" ").toLowerCase();
        const uid = event.key.participant || event.key.remoteJid;

        try {
            if (!args[0]) {
                const ran = ["Bolo baby", "hum", "type help baby", "Hmm jan"];
                const sent = await sock.sendMessage(chatId, { text: ran[Math.floor(Math.random() * ran.length)] }, { quoted: event });
                trackMessageId(sent?.key?.id);
                return;
            }

            if (args[0] === 'remove' || args[0] === 'rm') {
                const keyword = args[0];
                const rest = aryan.replace(`${keyword} `, "").trim();
                if (!rest || rest === keyword) {
                    return sock.sendMessage(chatId, { text: '❌ | Format: remove [message] OR rm [message] - [index]' }, { quoted: event });
                }

                if (rest.includes('-')) {
                    const [fi, f] = rest.split(/\s*-\s*/);
                    const da = (await axios.get(`${link}?remove=${encodeURIComponent(fi.trim())}&index=${f.trim()}&senderID=${uid}`)).data.message;
                    return sock.sendMessage(chatId, { text: da }, { quoted: event });
                } else {
                    const dat = (await axios.get(`${link}?remove=${encodeURIComponent(rest)}&senderID=${uid}`)).data.message;
                    return sock.sendMessage(chatId, { text: dat }, { quoted: event });
                }
            }

            if (args[0] === 'list') {
                if (args[1] === 'all') {
                    const data = (await axios.get(`${link}?list=all`)).data;
                    const limit = parseInt(args[2]) || 100;
                    const teachers = data?.teacher?.teacherList?.slice(0, limit) || [];
                    const output = teachers.map((item, i) => {
                        const number = Object.keys(item)[0];
                        const value = item[number];
                        return `${i + 1}/ ${number}: ${value}`;
                    }).join('\n');
                    const totalTeach = data.length || teachers.length || 0;
                    return sock.sendMessage(chatId, { text: `Total Teach = ${totalTeach}\n👑 | List of Teachers of baby\n${output}` }, { quoted: event });
                } else {
                    const d = (await axios.get(`${link}?list=all`)).data;
                    return sock.sendMessage(chatId, { text: `❇️ | Total Teach = ${d.length || "api off"}\n♻️ | Total Response = ${d.responseLength || "api off"}` }, { quoted: event });
                }
            }

            if (args[0] === 'msg') {
                const fuk = aryan.replace("msg ", "");
                const d = (await axios.get(`${link}?list=${fuk}`)).data.data;
                return sock.sendMessage(chatId, { text: `Message ${fuk} = ${d}` }, { quoted: event });
            }

            if (args[0] === 'edit') {
                if (!aryan.includes('-')) {
                    return sock.sendMessage(chatId, { text: '❌ | Invalid format! Use: edit [YourMessage] - [NewReply]' }, { quoted: event });
                }
                const parts = aryan.replace("edit ", "").split(/\s*-\s*/);
                const editKey = parts[0]?.trim();
                const newReply = parts[1]?.trim();
                if (!editKey || !newReply || newReply.length < 1) {
                    return sock.sendMessage(chatId, { text: '❌ | Invalid format! Use: edit [YourMessage] - [NewReply]' }, { quoted: event });
                }
                const dA = (await axios.get(`${link}?edit=${encodeURIComponent(editKey)}&replace=${encodeURIComponent(newReply)}&senderID=${uid}`)).data.message;
                return sock.sendMessage(chatId, { text: dA }, { quoted: event });
            }

            if (args[0] === 'teach' && args[1] !== 'amar' && args[1] !== 'react') {
                if (!aryan.includes('-')) {
                    return sock.sendMessage(chatId, { text: '❌ | Invalid format! Use: teach [message] - [reply1], [reply2]...' }, { quoted: event });
                }
                const [comd, command] = aryan.split(/\s*-\s*/);
                const final = comd.replace("teach ", "").trim();
                if (!command || command.length < 2) return sock.sendMessage(chatId, { text: '❌ | Invalid format!' }, { quoted: event });
                const re = await axios.get(`${link}?teach=${encodeURIComponent(final)}&reply=${encodeURIComponent(command)}&senderID=${uid}&threadID=${chatId}`);
                const tex = re.data.message;
                return sock.sendMessage(chatId, { text: `✅ Replies added ${tex}\nTeachs: ${re.data.teachs}` }, { quoted: event });
            }

            if (args[0] === 'teach' && args[1] === 'amar') {
                if (!aryan.includes('-')) {
                    return sock.sendMessage(chatId, { text: '❌ | Invalid format!' }, { quoted: event });
                }
                const [comd, command] = aryan.split(/\s*-\s*/);
                const final = comd.replace("teach ", "").trim();
                if (!command || command.length < 2) return sock.sendMessage(chatId, { text: '❌ | Invalid format!' }, { quoted: event });
                const tex = (await axios.get(`${link}?teach=${encodeURIComponent(final)}&senderID=${uid}&reply=${encodeURIComponent(command)}&key=intro`)).data.message;
                return sock.sendMessage(chatId, { text: `✅ Replies added ${tex}` }, { quoted: event });
            }

            if (args[0] === 'teach' && args[1] === 'react') {
                if (!aryan.includes('-')) {
                    return sock.sendMessage(chatId, { text: '❌ | Invalid format!' }, { quoted: event });
                }
                const [comd, command] = aryan.split(/\s*-\s*/);
                const final = comd.replace("teach react ", "").trim();
                if (!command || command.length < 2) return sock.sendMessage(chatId, { text: '❌ | Invalid format!' }, { quoted: event });
                const tex = (await axios.get(`${link}?teach=${encodeURIComponent(final)}&react=${encodeURIComponent(command)}`)).data.message;
                return sock.sendMessage(chatId, { text: `✅ Replies added ${tex}` }, { quoted: event });
            }

            if (aryan.includes('amar name ki') || aryan.includes('amr nam ki') || aryan.includes('amar nam ki') || aryan.includes('amr name ki') || aryan.includes('whats my name')) {
                const data = (await axios.get(`${link}?text=amar name ki&senderID=${uid}&key=intro`)).data.reply;
                const sent = await sock.sendMessage(chatId, { text: data }, { quoted: event });
                trackMessageId(sent?.key?.id);
                return;
            }

            const res = await axios.get(`${link}?text=${encodeURIComponent(aryan)}&senderID=${uid}&font=1`);
            const sent = await sock.sendMessage(chatId, { text: res.data.reply }, { quoted: event });
            trackMessageId(sent?.key?.id);

        } catch (e) {
            console.error('baby.js onStart Error:', e.message);
        }
    },

    onReply: async function ({ sock, chatId, event, getLang }) {
        const quotedStanzaId = event.message?.extendedTextMessage?.contextInfo?.stanzaId;
        if (!quotedStanzaId || !babyMessageIds.has(quotedStanzaId)) return;

        const body = (event.message?.conversation || event.message?.extendedTextMessage?.text || "").trim();
        if (!body) return;

        const uid = event.key.participant || event.key.remoteJid;
        const botID = sock.user.id.split(":")[0];
        const botLid = sock.user.lid;
        const botLidNumber = botLid ? botLid.split(":")[0].split("@")[0] : "";
        const uidNumber = uid.split(":")[0].split("@")[0];
        if (uid.includes(botID) || uid === botLid || (botLidNumber && uidNumber === botLidNumber)) return;

        try {
            const res = await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(body)}&senderID=${uid}&font=1`);
            const sent = await sock.sendMessage(chatId, { text: res.data.reply }, { quoted: event });
            trackMessageId(sent?.key?.id);
        } catch (e) {
            console.error('onReply AI Error:', e.message);
        }
    }
};
