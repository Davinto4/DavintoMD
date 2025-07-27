module.exports = {
  name: 'sticker',
  description: 'Convert image to sticker',
  run: async ({ sock, m }) => {
    if (!m.raw.message.imageMessage) {
      return await sock.sendMessage(m.chat, { text: 'Send an image with caption !sticker' }, { quoted: m.raw });
    }
    const buffer = await sock.downloadMediaMessage(m.raw);
    await sock.sendMessage(m.chat, { sticker: { url: buffer } }, { quoted: m.raw });
  }
};
