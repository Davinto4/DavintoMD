const ytdl = require('ytdl-core');
module.exports = {
  name: 'download',
  description: 'Download YouTube video',
  run: async ({ sock, m, args }) => {
    const url = args[0];
    if (!url || !ytdl.validateURL(url)) {
      return sock.sendMessage(m.chat, { text: 'Provide a valid YouTube link' }, { quoted: m.raw });
    }
    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'videoandaudio' });
    const stream = ytdl.downloadFromInfo(info, { format });
    await sock.sendMessage(m.chat, { video: stream, caption: `*${info.videoDetails.title}*` }, { quoted: m.raw });
  }
};
