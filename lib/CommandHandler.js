const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

class CommandHandler {
    constructor(sock) {
        this.sock = sock;
        this.commands = new Map();
        this.aliases = new Map();
    }

    async loadCommands() {
        const commandsDir = path.join(__dirname, '../commands');
        const categories = await fs.readdir(commandsDir);
        
        for (const category of categories) {
            const categoryPath = path.join(commandsDir, category);
            if ((await fs.stat(categoryPath)).isDirectory()) {
                const files = (await fs.readdir(categoryPath)).filter(f => f.endsWith('.js'));
                for (const file of files) {
                    const command = require(path.join(categoryPath, file));
                    if (command.name) {
                        this.commands.set(command.name, { ...command, category });
                        if (command.aliases) {
                            command.aliases.forEach(alias => this.aliases.set(alias, command.name));
                        }
                    }
                }
            }
        }
        console.log(`🚀 Loaded ${this.commands.size} commands across ${categories.length} categories.`);
    }

    async execute(m) {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        if (!body.startsWith(config.prefix)) return;

        const args = body.trim().split(/\s+/);
        const commandName = args.shift().slice(1).toLowerCase();

        let commandData = this.commands.get(commandName) || this.commands.get(this.aliases.get(commandName));
        if (!commandData) return;

        const sender = msg.key.participant || msg.key.remoteJid;
        const isOwner = sender.split('@')[0] === config.ownerNumber;
        const isGroup = msg.key.remoteJid.endsWith('@g.us');

        if (commandData.ownerOnly && !isOwner) return this.sock.sendMessage(msg.key.remoteJid, { text: '❌ *Owner Only!*' }, { quoted: msg });
        if (commandData.groupOnly && !isGroup) return this.sock.sendMessage(msg.key.remoteJid, { text: '❌ *Group Only!*' }, { quoted: msg });

        try {
            await commandData.run(this.sock, msg, args, { isOwner, sender, isGroup, body });
        } catch (err) {
            console.error(`Error in ${commandName}:`, err);
            this.sock.sendMessage(msg.key.remoteJid, { text: `⚠️ Error: ${err.message}` }, { quoted: msg });
        }
    }
}
module.exports = CommandHandler;
