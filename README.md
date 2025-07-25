# 🤖 AI Chat Widget Builder - FREE TikTok Giveaway!

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> **⚠️ IMPORTANT DISCLAIMER:** This tool was originally built for my personal use and is being shared "as-is" with the community. It has NOT been security tested for public use. You should audit and modify the code yourself before using it in production. Use at your own risk!

Build your own customizable AI chat widget with voice capabilities! This includes both the widget source code and a visual configurator to theme it without coding.

![Chat Widget Demo](https://path-to-your/demo.gif)

## ✨ What You Get

- 🎨 **Visual Configurator** - No coding needed to customize colors, icons, and settings
- 🗣️ **Voice Enabled** - Full ElevenLabs integration for voice conversations  
- 📱 **Two Versions** - Voice-enabled OR lightweight text-only
- 🚀 **Real-Time Chat** - WebSocket powered for instant responses
- ✍️ **Rich Text** - Markdown support with typewriter effects
- 🔧 **Fully Customizable** - Change everything to match your brand

## 🚀 Quick Start (TL;DR)

**What you need:** Node.js installed on your computer

```bash
# 1. Clone this repo
git clone [your-repo-url]
cd chat-widget

# 2. Install dependencies  
npm install

# 3. Configure your widget (see below)
# 4. Build it
npm run build

# 5. Upload /dist folder to your website
```

## 📋 Step-by-Step Setup

### Step 1: Design Your Widget 🎨

1. Open `/configurator/index.html` in your browser
2. Customize colors, icons, and settings using the visual interface
3. **Important:** Add your ElevenLabs Agent ID and WebSocket URL
4. Copy the generated configuration code

### Step 2: Build Your Widget 🔨

1. Create `src/js/config.js` and paste your configuration
2. Run `npm run build` 
3. Your widget files will be in the `/dist` folder

### Step 3: Add to Your Website 🌐

Upload the `/dist` folder contents and add this to your HTML:

```html
<!-- Add CSS -->
<link rel="stylesheet" href="your-site.com/dist/styles.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

<!-- Add JavaScript -->
<script src="your-site.com/dist/widget-elevenlabs.min.js"></script>
<script>window.ChatWidget.init();</script>
```

## ⚙️ Configuration Options

| Setting | What It Does |
|---------|-------------|
| `widgetTitle` | Title in the chat header |
| `initialMessage` | First message from AI |
| `position` | Where widget appears (bottom-right, etc.) |
| `colors.*` | All colors (primary, accent, messages) |
| `icons.*` | All icons (Font Awesome or custom images) |
| `enableVoice` | Turn voice features on/off |
| `elevenLabsAgentId` | Your ElevenLabs Agent ID |
| `websocketUrl` | Your backend server URL |

## 🔌 Backend Requirements

**You need a WebSocket server!** This widget is frontend-only and requires a backend to handle the AI conversation logic.

**Widget sends:**
```json
{
  "type": "chat_message",
  "sessionId": "abc123",
  "message": "Hello!"
}
```

**Your server should respond with:**
```json
{
  "type": "chat_response", 
  "message": "Hi! How can I help?"
}
```

## 🛠️ Development Mode

Want to modify the code? Run `npm run dev` for live reloading while you work.

## ⚠️ Things to Know

- **Security:** Audit this code before production use
- **Complexity:** This isn't beginner-friendly - some coding knowledge helpful
- **Backend Required:** You need a WebSocket server (not included)
- **ElevenLabs:** You need an ElevenLabs account for voice features
- **Testing:** Test thoroughly before deploying to real websites

## 🎯 Community & Support

**🏫 Skool Community:** Join our AI Freedom Finders community for support, discussions, and updates: https://www.skool.com/ai-freedom-finders

**📱 TikTok:** Follow for AI tutorials, tips, and behind-the-scenes content: https://www.tiktok.com/@ai_entrepreneur_educator

**🌐 Website:** https://bramforth.ai

---

Built with ❤️ for the AI community. Happy coding!

## 📄 License

MIT License - Use it, modify it, share it!
