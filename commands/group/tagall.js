module.exports = {
    name: 'tagall',
    category: 'group',
    groupOnly: true,
    run: async (sock, msg, args, { isOwner, sender }) => {
        const groupMeta = await sock.groupMetadata(msg.key.remoteJid);
        const members = groupMeta.participants;
        let text = args.join(' ') || 'Attention Everyone!';
        let mentions = [];
        
        text += '\n\n';
        for (const mem of members) {
            text += `@${mem.id.split('@')[0]}\n`;
            mentions.push(mem.id);
        }
        
        sock.sendMessage(msg.key.remoteJid, { text, mentions }, { quoted: msg });
    }
};
