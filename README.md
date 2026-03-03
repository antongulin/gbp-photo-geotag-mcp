# 📍 GBP Photo Geotag

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![Trigger.dev](https://img.shields.io/badge/Trigger.dev-Cloud%20Hosted-6366f1)](https://trigger.dev)

> **Add GPS coordinates and location metadata to your photos — boost your Google Business Profile with geotagged images.**

Geotagging adds invisible location data to your photos. When you upload these photos to Google Business Profile, Google Maps, or your website, search engines can see exactly where your business is located. This helps your business show up in local search results and Google Maps.

**Created by [Boost Business AI](https://boostbusiness.ai)** — Custom AI solutions for local businesses.

---

## 🚀 Three Ways to Use

Choose the option that works best for you:

| #   | Option                                                         | Best For                                               | What You Need         |
| --- | -------------------------------------------------------------- | ------------------------------------------------------ | --------------------- |
| 🌐  | **[Web App](#-option-1-web-app-easiest)**                      | Anyone — no technical skills needed                    | Just a web browser    |
| 🤖  | **[MCP for AI Agents](#-option-2-mcp-for-ai-agents)**          | People who use AI assistants like Claude, Cursor, etc. | An AI agent + API key |
| 💻  | **[Download & Run Locally](#-option-3-download--run-locally)** | Developers who want full control                       | Node.js + ExifTool    |

---

## 🌐 Option 1: Web App (Easiest)

**No downloads. No setup. Just open and use.**

### 👉 [Open the Web App](https://resilient-tiramisu-8ae64a.netlify.app)

### How to Use

1. **Open** the link above in your browser
2. **Upload** your photo (drag & drop or click to browse)
3. **See current metadata** — the app instantly scans your photo and shows what location data already exists (if any)
4. **Enter your business address** (e.g., `123 Main Street, Seattle, WA 98101`)
5. **Add business info** (optional) — business name, SEO keywords, copyright
6. **Click "Geotag & Download Photo"**
7. **Done!** Your geotagged photo downloads automatically with a Before/After comparison showing exactly what changed

### Features

- 🌓 **Dark & Light theme** — toggle in the top-right corner
- 📊 **Before/After comparison** — see exactly what metadata was added
- 📱 **Works on mobile** — use from your phone or tablet
- 🔒 **Private** — your photos are processed and not stored anywhere

### Supported File Formats

| Format | Extensions      |
| ------ | --------------- |
| JPEG   | `.jpg`, `.jpeg` |
| PNG    | `.png`          |
| TIFF   | `.tiff`, `.tif` |
| WebP   | `.webp`         |
| HEIC   | `.heic`         |

---

## 🤖 Option 2: MCP for AI Agents

If you use an AI assistant (like Claude, Cursor, VS Code Copilot, Windsurf, or Gemini), you can add this tool directly to your AI agent. Then just ask your AI in plain English to geotag your photos — it handles everything automatically.

### What is MCP?

[MCP (Model Context Protocol)](https://modelcontextprotocol.io) is a standard that lets AI assistants use external tools. By adding this MCP server to your AI agent, your AI gains the ability to geotag photos, look up GPS coordinates, and more — all through natural conversation.

### Available Tools

Your AI agent gets access to these tools:

| Tool                      | What It Does                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------- |
| **Geocode Address**       | Converts any address to GPS coordinates (e.g., "123 Main St" → latitude/longitude) |
| **Reverse Geocode**       | Converts GPS coordinates to a readable address                                     |
| **Geotag Photo**          | Adds GPS, business info, and SEO data to a photo                                   |
| **Generate SEO Filename** | Creates search-optimized filenames (e.g., `acme-plumbing-seattle-wa.jpg`)          |
| **Read Geotag**           | Shows what location data a photo already contains                                  |

### Get Your API Key

To use MCP, you'll need a free API key. **Request one here:**

- 📧 **Email:** [anton@boostbusiness.ai](mailto:anton@boostbusiness.ai)
- 🌐 **Website:** [boostbusiness.ai](https://boostbusiness.ai)
- 💬 **GitHub:** [Request access](https://github.com/antongulin/gbp-photo-geotag-mcp/issues/new?template=access_request.md&title=Cloud+MCP+Access+Request)

### Setup Instructions

Once you have your API key, follow the instructions for your AI agent:

<details>
<summary><strong>Claude Desktop</strong> (click to expand)</summary>

1. Open Claude Desktop
2. Go to **Settings → Developer → Edit Config**
3. Add this to the config file:

```json
{
  "mcpServers": {
    "gbp-photo-geotag": {
      "command": "npx",
      "args": ["-y", "gbp-photo-geotag-mcp@latest", "start:client"],
      "env": {
        "GBP_GEOTAG_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

4. Replace `YOUR_API_KEY_HERE` with the key you received
5. Restart Claude Desktop

**Config file location:**

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

</details>

<details>
<summary><strong>Cursor</strong> (click to expand)</summary>

1. Create a file called `mcp.json` in your project's `.cursor` folder (or `~/.cursor/mcp.json` for global access)
2. Add this content:

```json
{
  "mcpServers": {
    "gbp-photo-geotag": {
      "command": "npx",
      "args": ["-y", "gbp-photo-geotag-mcp@latest", "start:client"],
      "env": {
        "GBP_GEOTAG_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

3. Replace `YOUR_API_KEY_HERE` with the key you received
4. Restart Cursor

</details>

<details>
<summary><strong>VS Code (Copilot)</strong> (click to expand)</summary>

1. Create a file called `mcp.json` in your project's `.vscode` folder
2. Add this content:

```json
{
  "servers": {
    "gbp-photo-geotag": {
      "command": "npx",
      "args": ["-y", "gbp-photo-geotag-mcp@latest", "start:client"],
      "env": {
        "GBP_GEOTAG_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

3. Replace `YOUR_API_KEY_HERE` with the key you received
4. Restart VS Code

</details>

<details>
<summary><strong>Windsurf</strong> (click to expand)</summary>

1. Open or create the file `~/.codeium/windsurf/mcp_config.json`
2. Add this content:

```json
{
  "mcpServers": {
    "gbp-photo-geotag": {
      "command": "npx",
      "args": ["-y", "gbp-photo-geotag-mcp@latest", "start:client"],
      "env": {
        "GBP_GEOTAG_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

3. Replace `YOUR_API_KEY_HERE` with the key you received
4. Restart Windsurf

</details>

<details>
<summary><strong>Gemini CLI</strong> (click to expand)</summary>

1. Open or create the file `~/.gemini/settings.json`
2. Add this content:

```json
{
  "mcpServers": {
    "gbp-photo-geotag": {
      "command": "npx",
      "args": ["-y", "gbp-photo-geotag-mcp@latest", "start:client"],
      "env": {
        "GBP_GEOTAG_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

3. Replace `YOUR_API_KEY_HERE` with the key you received
4. Restart Gemini CLI

</details>

### Example: What to Say to Your AI

Once everything is set up, just talk to your AI agent in plain English:

> _"Geotag the photo at https://example.com/storefront.jpg with our business address 456 Oak Ave, Temecula, CA. Our business name is Acme Plumbing. Add keywords: plumber, temecula, emergency repair."_

> _"What GPS data does the image at https://example.com/photo.jpg have?"_

> _"Generate an SEO filename for our water heater installation photo in Seattle, WA for Acme Plumbing."_

> _"Look up the GPS coordinates for 1600 Amphitheatre Parkway, Mountain View, CA."_

---

## 💻 Option 3: Download & Run Locally

For full control, you can download this project and run everything on your own computer. This mode works with local image files and doesn't need an internet connection for processing (only for geocoding addresses).

### What You'll Need

1. **Node.js 18 or later** — [Download here](https://nodejs.org) (choose the "LTS" version)
2. **ExifTool** — A free tool for reading/writing photo metadata

**Install ExifTool:**

```bash
# macOS (using Homebrew)
brew install exiftool

# Ubuntu/Debian Linux
sudo apt-get install exiftool

# Windows (using Chocolatey)
choco install exiftool
```

### Installation

1. [Download this project as a ZIP](https://github.com/antongulin/gbp-photo-geotag-mcp/archive/refs/heads/main.zip) or clone it:

```bash
git clone https://github.com/antongulin/gbp-photo-geotag-mcp.git
```

2. Open a terminal in the project folder and run:

```bash
cd gbp-photo-geotag-mcp
npm install
npm run build
```

### Connect to Your AI Agent

Add this to your AI agent's MCP config (see the [MCP section above](#setup-instructions) for where to find the config file):

```json
{
  "mcpServers": {
    "gbp-photo-geotag": {
      "command": "node",
      "args": ["/full/path/to/gbp-photo-geotag-mcp/dist/index.js"]
    }
  }
}
```

> ⚠️ **Important:** Replace `/full/path/to/` with the actual path where you downloaded the project.

### Local Tools

When running locally, your AI agent gets these additional tools:

| Tool                | What It Does                                    |
| ------------------- | ----------------------------------------------- |
| **Add Geotag**      | Add GPS and location data to a local photo file |
| **Batch Geotag**    | Process all photos in a folder at once          |
| **Rename for SEO**  | Rename files to search-friendly format          |
| **Read Geotag**     | Check what location data a photo already has    |
| **Geocode Address** | Look up GPS coordinates for any address         |
| **Reverse Geocode** | Get address from GPS coordinates                |

---

## 📊 What Metadata Gets Added to Your Photos?

When you geotag a photo, we embed the following invisible data:

| Category         | What's Added                                        |
| ---------------- | --------------------------------------------------- |
| **GPS**          | Exact latitude, longitude, and altitude coordinates |
| **Location**     | City, State, Country, and specific location name    |
| **Business**     | Your business name as the photo artist/creator      |
| **Copyright**    | Copyright notice with your business name and year   |
| **SEO Keywords** | Relevant keywords for search engine optimization    |

This data is invisible to people viewing the photo but readable by search engines, Google Maps, and other platforms.

---

## 🎯 Why Geotag Your Photos?

### Google Business Profile

Adding location data to your photos before uploading to Google Business Profile helps Google understand exactly where your business is. This can improve your ranking on:

- **Google Maps** — Show up when people search near your location
- **Local Search** — Appear in "near me" searches
- **Google Images** — Your photos can rank in image search results

### Website Photos

Photos on your website with embedded GPS data reinforce your business location to search engines, helping with local SEO.

### Best Photos to Geotag

1. 🏪 **Storefront** — Tag with your exact business address
2. 🔧 **Job site / service photos** — Tag with the location where you did the work
3. 👥 **Team photos** — Tag with your office location
4. 📦 **Product photos** — Tag with your business location

---

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────────────────┐
│              How You Use It                          │
├─────────────┬─────────────────┬─────────────────────┤
│  🌐 Web App │  🤖 AI Agent    │  💻 Local Install   │
│  (Browser)  │  (MCP Protocol) │  (Your Computer)    │
└──────┬──────┴────────┬────────┴──────────┬──────────┘
       │               │                   │
       ▼               ▼                   ▼
┌──────────────┐ ┌──────────────┐  ┌──────────────────┐
│ Netlify App  │ │ Client MCP   │  │ Local MCP Server  │
│ (Web + API)  │ │   Server     │  │ + ExifTool        │
└──────┬───────┘ └──────┬───────┘  └──────────────────┘
       │                │
       ▼                ▼
┌────────────────────────────────┐
│     Trigger.dev Cloud Tasks    │
│  (Geocoding + ExifTool + GPS)  │
└────────────────────────────────┘
```

---

## 🔧 For Developers

<details>
<summary>Development commands (click to expand)</summary>

```bash
# Run local MCP in development mode
npm run dev

# Run cloud client MCP server
npm run start:client

# Run tests
npm test

# Build for production
npm run build

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

</details>

---

## 📄 License

MIT License — free to use, modify, and share. See [LICENSE](LICENSE) file.

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork** this repository
2. **Create** a feature branch (`git checkout -b feature/YourFeature`)
3. **Commit** your changes (`git commit -m 'Add YourFeature'`)
4. **Push** to the branch (`git push origin feature/YourFeature`)
5. **Open** a Pull Request

---

## 💡 About Boost Business AI

[Boost Business AI](https://boostbusiness.ai) provides custom AI solutions for local businesses, helping them leverage AI tools to improve their online visibility and customer engagement.

**Need help with your local SEO?** [Contact us](mailto:anton@boostbusiness.ai) for custom solutions tailored to your business.

---

## 🔗 Helpful Links

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io) — The standard that connects AI to tools
- [Trigger.dev](https://trigger.dev) — Cloud infrastructure powering the backend
- [ExifTool](https://exiftool.org) — The tool that reads/writes photo metadata
- [OpenStreetMap Nominatim](https://nominatim.org) — Free geocoding service used for address lookups

---

## ⭐ Found This Useful?

If this tool helps your business, please give it a ⭐ on GitHub — it helps others find it too!

---

**Keywords**: geotag, geotagging, EXIF, GPS, photo metadata, Google Business Profile, GBP, local SEO, image optimization, location metadata, MCP, Model Context Protocol, AI agent tools
