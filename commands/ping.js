module.exports = {
  name: 'ping',
  description: 'Check if the bot is alive',
  run: async ({ sock, m, args }) => {
    const start = Date.now();
    await sock.sendMessage(m.chat, { text: 'Pinging...' }, { quoted: m.raw });
    const end = Date.now();
    await sock.sendMessage(m.chat, { text: `Pong! ${end - start}ms` }, { quoted: m.raw });
  }
};
