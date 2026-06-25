# DavintoMD
**The Ultimate Professional WhatsApp Multi-Device Bot**

## 🚀 Features
- **Multi-Device Support:** Works seamlessly across all devices.
- **Pairing Code Auth:** No QR scanning required.
- **Modular Architecture:** Easy to add custom commands.
- **Multi-Database:** Supports JSON (default), MongoDB, and SQLite.
- **Premium Website:** Included modern, responsive website.

## 📦 Installation

### Termux / VPS
```bash
bash <(curl -s https://raw.githubusercontent.com/davinto4/DavintoMD/main/deployment/install.sh)
cd DavintoMD
node index.js
```

### Docker
```bash
docker-compose up -d
```

### PM2
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## ⚙️ Configuration
Edit `config.js` to customize your bot:
- `ownerNumber`: Your WhatsApp number (e.g., 2348169045105)
- `prefix`: Command prefix (default: `.`)
- `mode`: `public` or `private`

## 🌐 Deployment
DavintoMD is pre-configured for:
- Railway
- Render
- Koyeb
- Heroku
- Pterodactyl Panel
- Any Node.js VPS

## 📞 Support
- **Owner:** Davinto
- **Channel:** [Join Official Channel](https://whatsapp.com/channel/0029Vb1V3aWC6ZvguZLoMv40)
- **Website:** https://davintomd.netlify.app
