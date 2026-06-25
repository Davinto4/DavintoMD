const axios = require('axios');
module.exports = {
    name: 'joke',
    category: 'fun',
    run: async (sock, msg) => {
        try {
            const { data } = await axios.get('https://v2.jokeapi.dev/joke/Any?safe-mode');
            const joke = data.setup ? `${data.setup}\n${data.delivery}` : data.joke;
            sock.sendMessage(msg.key.remoteJid, { text: `😂 ${joke}` }, { quoted: msg });
        } catch (e) {
            sock.sendMessage(msg.key.remoteJid, { text: 'Failed to fetch joke.' }, { quoted: msg });
        }
    }
};
