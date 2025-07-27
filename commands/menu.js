const { BOT_NAME, PREFIX } = require('../config');

module.exports = {
  name: 'menu',
  description: 'Show command list',
  run: async ({ sock, m }) => {
    const text = `*${BOT_NAME} Menu*\n
${PREFIX}menu  - Show this menu
${PREFIX}ping  - Test response time
`;
    await sock.sendMessage(m.chat, { text }, { quoted: m.raw });
  }
};
