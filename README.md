# DavintoMD - Your Multi-Device WhatsApp AI Assistant

![WhatsApp Icon](https://img.icons8.com/color/48/000000/whatsapp--v1.png) ![OpenAI Logo](https://img.icons8.com/color/48/000000/openai.png) ![Node.js Logo](https://img.icons8.com/fluency/48/000000/node-js.png)

DavintoMD is an intelligent, multi-device WhatsApp bot powered by Node.js and OpenAI's GPT. This bot is designed to provide quick, helpful, and concise responses based on a defined persona, making it ideal for various assistance-based applications, including light informational support, quick answers, and more.

## ✨ Features

* **Multi-Device Support:** Connects to WhatsApp using the multi-device feature, allowing it to run independently of your phone's internet connection once paired.
* **AI-Powered Responses:** Utilizes OpenAI's GPT models to generate intelligent and context-aware replies.
* **Customizable Persona:** Easily define and modify the bot's personality and knowledge base through a `DavintoMDPersona` string in the code.
* **Phone Number Pairing:** Simplifies the initial setup process by using WhatsApp's phone number pairing code.
* **Environment Variables:** Securely manages API keys and sensitive information using `.env` files.
* **Node.js Ecosystem:** Built with Node.js, providing a robust and scalable foundation.

---

## 🚀 Getting Started

Follow these steps to get your DavintoMD bot up and running on your local machine.

### Prerequisites

Before you begin, ensure you have the following installed:

* **Git:** For cloning the repository. Download from [git-scm.com](https://git-scm.com/downloads).
* **Node.js & npm:** The LTS version is recommended. Download from [nodejs.org](https://nodejs.org).
    * Verify installation by running:
        ```bash
        node -v
        npm -v
        ```
* **OpenAI API Key:** You'll need a secret API key from the OpenAI Platform.
    * Sign up/Log in at [platform.openai.com](https://platform.openai.com/).
    * Navigate to "API keys" (under your profile).
    * Click "Create new secret key" and copy it. **Keep it safe!** (It will be used in your `.env` file).
    * *Note: API usage incurs costs. Monitor your consumption.*

### Installation

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/Davinto4/DavintoMD.git](https://github.com/Davinto4/DavintoMD.git)
    cd DavintoMD
    ```

2.  **Initialize Node.js Project:**
    ```bash
    npm init -y
    ```

3.  **Configure for ES Modules:**
    Open `package.json` and add `"type": "module",` after `"main": "index.js"`. Your `package.json` should look like this:
    ```json
    {
      "name": "davintomd",
      "version": "1.0.0",
      "description": "A multi-device WhatsApp AI assistant powered by Node.js and OpenAI's GPT.",
      "main": "index.js",
      "type": "module", // <--- ADD THIS LINE
      "scripts": {
        "test": "echo \"Error: no test specified\" && exit 1"
      },
      "keywords": [
        "whatsapp-bot",
        "ai-assistant",
        "nodejs",
        "openai",
        "gpt",
        "multi-device",
        "baileys",
        "chat-automation",
        "davintomd"
      ],
      "author": "DAVINTO (+234 816 904 5105)",
      "license": "ISC"
    }
    ```
    Save the file.

4.  **Install Dependencies:**
    ```bash
    npm install @whiskeysockets/baileys openai dotenv qrcode-terminal
    ```

---

### Configuration

1.  **Create `.env` file:**
    In the root of your `DavintoMD` directory, create a new file named `.env`. Open it and add your OpenAI API key:
    ```
    OPENAI_API_KEY="YOUR_ACTUAL_OPENAI_API_KEY_HERE"
    ```
    Replace `"YOUR_ACTUAL_OPENAI_API_KEY_HERE"` with the key you copied from OpenAI. Save the file.

2.  **Create `.gitignore` file:**
    In the root of your `DavintoMD` directory, create a new file named `.gitignore`. Open it and add the following lines to prevent sensitive files from being committed to Git:
    ```
    # Node.js modules
    node_modules/

    # Environment variables
    .env

    # Baileys session data
    auth_info_baileys/

    # Log files (optional, but good practice)
    *.log
    ```
    Save the file.

3.  **Prepare `index.js`:**
    Ensure your `index.js` file (which contains the bot's core logic) is set up as provided in the previous instructions. It should include the `dotenv/config` import and the WhatsApp pairing logic.

---

## 🏃 Running the Bot

1.  **Start the bot:**
    Open your terminal, navigate to the `DavintoMD` directory, and run:
    ```bash
    node index.js
    ```

2.  **Pair with WhatsApp:**
    * The bot will prompt you to enter your WhatsApp phone number. Provide it (e.g., `2348012345678`).
    * It will then display an 8-digit **pairing code**.
    * On your phone, open WhatsApp:
        * Go to **Settings** (or **Linked Devices** on iOS)
        * Tap **Linked Devices**
        * Tap **Link a Device**
        * Tap **Link with Phone Number**
        * Enter the 8-digit code displayed in your terminal.
    * The bot should now connect. A folder named `auth_info_baileys` will be created to store your session.

---

## 🤖 Bot Persona Customization

The bot's behavior is primarily defined by the `DavintoMDPersona` string within `index.js`. You can modify this string to change its tone, knowledge, and response style.

```javascript
// Example from index.js
const DavintoMDPersona = `You are DavintoMD, a multi-device WhatsApp AI assistant.
Your primary role is to act as a helpful and informative assistant, providing concise and accurate answers.
// ... rest of your persona definition ...
`;

Adjust this text to refine your bot's personality and how it interacts with users. Remember to save index.js and restart the bot (node index.js) for changes to take effect.
💬 Community
Stay updated and connect with other users of DavintoMD!
 * WhatsApp Channel: whatsapp.com/channel/0029Vb1V3aWC6ZvguZLoMv40
 * WhatsApp Group Chat: chat.whatsapp.com/FUPdMKJnM4y9EBuTdZWyT2
📞 Contact
For direct inquiries or support, you can reach out to DAVINTO:
 * Name: DAVINTO
 * Phone (WhatsApp/Calls): +234 816 904 5105
🤝 Contributing
We welcome contributions! If you'd like to improve DavintoMD, please follow these steps:
 * Fork the repository.
 * Create a new branch (git checkout -b feature/your-feature-name).
 * Make your changes.
 * Commit your changes (git commit -m 'feat: Add new awesome feature').
 * Push to the branch (git push origin feature/your-feature-name).
 * Open a Pull Request.
📄 License
This project is licensed under the ISC License - see the LICENSE file for details.
🙏 Acknowledgements
 * WhiskeySockets/Baileys - The WhatsApp web API library.
 * OpenAI - For the powerful GPT models.
 * Node.js - The JavaScript runtime.
<!-- end list -->

