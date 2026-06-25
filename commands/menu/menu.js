const config = require('../../config');
const fs = require('fs');

module.exports = {
    name: 'menu',
    aliases: ['help', 'ownermenu', 'groupmenu', 'funmenu', 'settingsmenu', 'mediamenu', 'downloadmenu', 'aimenu', 'stickermenu', 'gamesmenu', 'utilitymenu'],
    category: 'menu',
    run: async (sock, msg, args, { isOwner }) => {
        const cmd = msg.message.conversation?.split(' ')[0].slice(1) || 'menu';
        const uptime = process.uptime();
        const h = Math.floor(uptime / 3600);
        const m = Math.floor(uptime % 3600 / 60);
        
        let menuText = `*${config.botName} v${config.version}*\n`;
        menuText += `*Owner:* ${config.ownerName}\n`;
        menuText += `*Uptime:* ${h}h ${m}m\n`;
        menuText += `*Mode:* ${config.mode}\n`;
        menuText += `*Prefix:* [ ${config.prefix} ]\n\n`;

        if (cmd === 'ownermenu') menuText += '*OWNER COMMANDS*\n.broadcast\n.restart\n.shutdown\n.block\n.unblock\n.ban\n.unban\n.setname\n.setbio\n.setpp\n.join\n.leave\n.getjid\n.clearchat';
        else if (cmd === 'groupmenu') menuText += '*GROUP COMMANDS*\n.tagall\n.hidetag\n.kick\n.add\n.promote\n.demote\n.link\n.revoke\n.mute\n.unmute\n.lock\n.unlock\n.antilink\n.antifake\n.antibadword\n.welcome\n.goodbye';
        else if (cmd === 'funmenu') menuText += '*FUN COMMANDS*\n.joke\n.roast\n.ship\n.rate\n.truth\n.dare\n.hug\n.kiss\n.slap\n.cuddle\n.flirt\n.pickup\n.meme\n.fact\n.quote';
        else if (cmd === 'aimenu') menuText += '*AI COMMANDS*\n.ai\n.ask\n.gpt\n.chat\n.translate\n.summarize\n.rewrite\n.code\n.debug';
        else if (cmd === 'mediamenu') menuText += '*MEDIA COMMANDS*\n.play\n.song\n.video\n.lyrics\n.audio\n.voice';
        else if (cmd === 'downloadmenu') menuText += '*DOWNLOAD COMMANDS*\n.ytmp3\n.ytmp4\n.tiktok\n.instagram\n.facebook\n.twitter\n.mediafire';
        else menuText += '*MAIN MENU*\nUse .ownermenu, .groupmenu, .funmenu, .aimenu, .mediamenu, .downloadmenu to see specific categories.\n\n*Channel:* ' + config.channelLink;

        menuText += `\n\n© 2026 ${config.ownerName}`;

        await sock.sendMessage(msg.key.remoteJid, { 
            image: { url: config.menuImage }, 
            caption: menuText,
            contextInfo: { externalAdReply: { title: config.botName, body: 'By Davinto', mediaUrl: config.websiteUrl, thumbnail: { url: config.menuImage } } }
        }, { quoted: msg });
    }
};
