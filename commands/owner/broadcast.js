module.exports = {
    name: 'broadcast',
    aliases: ['bc'],
    category: 'owner',
    ownerOnly: true,
    run: async (sock, msg, args) => {
        const text = args.join(' ');
        if (!text) return sock.sendMessage(msg.key.remoteJid, { text: '❌ Provide text to broadcast.' }, { quoted: msg });
        
        const groups = Object.keys(await sock.groupFetchAllParticipating());
        let success = 0;
        for (const gid of groups) {
            await sock.sendMessage(gid, { text: `*📢 BROADCAST*\n\n${text}\n\n- ${sock.user.name}` }).catch(() => {});
            success++;
        }
        sock.sendMessage(msg.key.remoteJid, { text: `✅ Broadcasted to ${success} groups.` }, { quoted: msg });
    }
};
