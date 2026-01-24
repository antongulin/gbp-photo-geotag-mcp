# 📍 GBP Photo Geotag MCP

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)

> **Add GPS coordinates and location metadata to photos for Google Business Profile SEO optimization**

An open-source [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that helps local businesses optimize their photos with geolocation data for better visibility on Google Maps and local search results.

**Created by [Boost Business AI](https://boostbusiness.ai)** - Custom AI solutions for local businesses.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📍 **Auto-Geocoding** | Convert any street address to GPS coordinates using OpenStreetMap (free, no API key) |
| 🗺️ **GPS Metadata** | Write EXIF GPS coordinates (latitude, longitude, altitude) |
| 🏢 **IPTC Location** | Add City, State, Country, and Sublocation fields |
| 📝 **XMP Metadata** | Include Creator, Rights, and Keywords |
| 📂 **Batch Processing** | Geotag entire folders of photos at once |
| 🔤 **SEO Renaming** | Rename files to `business-name-service-city-state.jpg` format |
| 🔄 **Backup Support** | Automatically creates backups before modifying files |

---

## 🚀 Quick Start

### Prerequisites

1. **Node.js 18+** - [Download](https://nodejs.org)
2. **ExifTool** - Required for metadata operations

```bash
# macOS
brew install exiftool

# Ubuntu/Debian
sudo apt-get install exiftool

# Windows (via Chocolatey)
choco install exiftool
```

### Installation

```bash
# Clone the repository
git clone https://github.com/boostbusinessai/gbp-photo-geotag-mcp.git
cd gbp-photo-geotag-mcp

# Install dependencies
npm install

# Build
npm run build
```

### Configure with Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "gbp-photo-geotag": {
      "command": "node",
      "args": ["/path/to/gbp-photo-geotag-mcp/dist/index.js"]
    }
  }
}
```

### Configure with Gemini CLI

Add to your Gemini settings (`~/.gemini/settings.json`):

```json
{
  "mcpServers": {
    "gbp-photo-geotag": {
      "command": "node",
      "args": ["/path/to/gbp-photo-geotag-mcp/dist/index.js"]
    }
  }
}
```

---

## 🛠️ Available Tools

### `add_geotag`

Add GPS and location metadata to a single photo.

```javascript
// Using address (auto-geocoded)
{
  "file_path": "/path/to/photo.jpg",
  "address": "123 Main Street, Seattle, WA 98101",
  "business_name": "Acme Plumbing",
  "keywords": ["plumber", "seattle", "emergency repair"]
}

// Using coordinates
{
  "file_path": "/path/to/photo.jpg",
  "latitude": 47.6062,
  "longitude": -122.3321,
  "city": "Seattle",
  "state": "Washington",
  "country": "United States"
}
```

### `geocode_address`

Convert an address to GPS coordinates.

```javascript
{
  "address": "Space Needle, Seattle, WA"
}
// Returns: { latitude: 47.6205, longitude: -122.3493, city: "Seattle", ... }
```

### `reverse_geocode`

Get address from GPS coordinates.

```javascript
{
  "latitude": 47.6205,
  "longitude": -122.3493
}
// Returns: { address: "400 Broad St, Seattle, WA 98109, United States", ... }
```

### `rename_for_seo`

Rename photos using SEO best practices.

```javascript
{
  "file_path": "/photos/IMG_1234.jpg",
  "business_name": "Acme Plumbing",
  "service": "water heater installation",
  "city": "Seattle",
  "state": "WA"
}
// Result: acme-plumbing-water-heater-installation-seattle-wa.jpg
```

### `batch_geotag`

Process multiple photos in a directory.

```javascript
{
  "directory": "/path/to/photos",
  "address": "123 Main St, Seattle, WA",
  "business_name": "Acme Plumbing",
  "recursive": true,
  "overwrite_original": false
}
```

### `read_geotag`

Read existing location metadata from a photo.

```javascript
{
  "file_path": "/path/to/photo.jpg"
}
```

---

## 🎯 Use Cases for Local SEO

### Google Business Profile Photos

Geotag photos before uploading to your GBP to reinforce location signals:

1. **Storefront photos** - Tag with your exact business address
2. **Service area photos** - Tag with the location where work was performed
3. **Team photos** - Tag with your office location
4. **Product photos** - Tag with your business location

### Website Images

While Google strips EXIF from GBP uploads, your website images retain metadata:

- Geotagged images on your website reinforce local relevance
- Search engines can use location data for image search results
- Third-party sites that embed your images preserve the geotags

### Social Media

Many social platforms preserve EXIF data, helping with local discovery.

---

## 📊 What Metadata is Added?

| Category | Fields Written |
|----------|----------------|
| **GPS** | GPSLatitude, GPSLongitude, GPSLatitudeRef, GPSLongitudeRef, GPSAltitude |
| **IPTC** | City, Province-State, Country-PrimaryLocationName, Sub-location, By-line, CopyrightNotice, Keywords |
| **XMP** | City, State, Country, Location, Creator, Rights, Subject |
| **EXIF** | Artist, Copyright |

---

## 🔧 Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 💡 About Boost Business AI

[Boost Business AI](https://boostbusiness.ai) provides custom AI solutions for local businesses, helping them leverage AI tools to improve their online visibility and customer engagement.

**Need help with your local SEO?** Contact us for custom solutions tailored to your business.

---

## 🔗 Related Resources

- [Model Context Protocol](https://modelcontextprotocol.io) - The MCP specification
- [ExifTool](https://exiftool.org) - The metadata tool powering this server
- [OpenStreetMap Nominatim](https://nominatim.org) - Free geocoding service used

---

## ⭐ Star History

If this project helps your business, please give it a ⭐ on GitHub!

---

**Keywords**: MCP, Model Context Protocol, geotag, geotagging, EXIF, GPS, photo metadata, Google Business Profile, GBP, local SEO, image optimization, location metadata, IPTC, XMP, photo SEO, local business, Google Maps
