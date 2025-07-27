const fetch = require('node-fetch');
module.exports = {
  name: 'ai',
  description: 'Ask an AI question',
  run: async ({ sock, m, args }) => {
    const prompt = args.join(' ');
    if (!prompt) return sock.sendMessage(m.chat, { text: 'Ask something after !ai' }, { quoted: m.raw });
    const resp = await fetch('https://api.example.com/free-ai', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ prompt })
    });
    const json = await resp.json();
    await sock.sendMessage(m.chat, { text: json.answer || 'Oops, no answer' }, { quoted: m.raw });
  }
};
