const yts = require('yt-search');
module.exports = {
    name: 'ytmp3',
    aliases: ['yta', 'song'],
    category: 'download',
    run: async (sock, msg, args) => {
        const query = args.join(' ');
        if (!query) return sock.sendMessage(msg.key.remoteJid, { text: '❌ Provide a YouTube URL or title.' }, { quoted: msg });
        
        await sock.sendMessage(msg.key.remoteJid, { text: '⏳ Searching and downloading audio...' }, { quoted: msg });
        try {
            const results = await yts(query);
            const video = results.videos[0];
            if (!video) return sock.sendMessage(msg.key.remoteJid, { text: '❌ Not found.' }, { quoted: msg });
            
            // Note: In production, use a reliable yt-download API or ytdl-core with ffmpeg
            sock.sendMessage(msg.key.remoteJid, { 
                audio: { url: video.url }, // Placeholder URL
                mimetype: 'audio/mpeg',
                contextInfo: { externalAdReply: { title: video.title, body: video.author.name, thumbnail: { url: video.thumbnail } } }
            }, { quoted: msg });
        } catch (e) {
            sock.sendMessage(msg.key.remoteJid, { text: '⚠️ Download failed.' }, { quoted: msg });
        }
    }
};
