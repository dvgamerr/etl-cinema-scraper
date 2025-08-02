# 🎬 Cinema Scraper

<div align="center">

[![build-containers](https://github.com/dvgamerr/etl-cinema-scraper/actions/workflows/build-ghcr.yml/badge.svg)](https://github.com/dvgamerr/etl-cinema-scraper/actions/workflows/build-ghcr.yml)
![License](https://img.shields.io/dub/l/vibe-d.svg?style=flat-square)
![Version](https://img.shields.io/badge/version-v2.2-blue?style=flat-square)
![Bun](https://img.shields.io/badge/Bun-000?style=flat-square&logo=bun&logoColor=white)

**🚀 Lightning-fast movie data scraper for Thailand's major cinema chains**

*Extract real-time movie listings from Major Cineplex and SF CinemaCity with ease*

</div>

---

## ✨ Features

- 🎯 **Multi-Cinema Support**: Scrapes from Major Cineplex and SF CinemaCity
- ⚡ **High Performance**: Built with Bun.js for blazing-fast execution
- 🤖 **Smart Scraping**: Uses Puppeteer with randomized user agents
- 📊 **Structured Data**: Outputs clean, standardized JSON format
- 🔄 **Real-time Updates**: Gets current and upcoming movie listings
- 🐳 **Docker Ready**: Containerized for easy deployment
- 📤 **API Integration**: Built-in support for data uploading to external APIs

## 🎬 Supported Cinemas

| Cinema Chain | Status | Movies Count |
|--------------|--------|--------------|
| 🏢 Major Cineplex | ✅ Active | ~2000+ movies |
| 🎪 SF CinemaCity | ✅ Active | ~1500+ movies |

## 🚀 Quick Start

### Prerequisites
- [Bun.js](https://bun.sh/) runtime
- Node.js 18+ (if using npm/yarn)

### Installation

```bash
# Clone the repository
git clone https://github.com/dvgamerr/cinema-scraper.git
cd cinema-scraper

# Install dependencies
bun install

# Run the scraper
bun dev
```

## 📁 Output Structure

The scraper generates JSON files in the `./output` directory:

```
output/
├── results.json          # 📋 Combined standardized data
├── major-cineplex.json   # 🏢 Raw Major Cineplex data
└── sf-cinemacity.json    # 🎪 Raw SF CinemaCity data
```

### 📄 Sample Output Format

```json
{
  "name": "movie-slug",
  "name_en": "Movie Title in English",
  "name_th": "ชื่อหนังภาษาไทย",
  "display": "Display Name",
  "release": "2025-06-06T17:00:00.000Z",
  "genre": "Action",
  "time": 120,
  "theater": {
    "major": {
      "cover": "https://cdn.majorcineplex.com/...",
      "url": "https://www.majorcineplex.com/..."
    }
  }
}
```

## 🐳 Docker Deployment

```bash
# Build the image
docker build -t cinema-scraper .

# Run the container
docker run -v $(pwd)/output:/app/output cinema-scraper
```

## 📊 Performance

- ⚡ **Speed**: Processes 3000+ movies in ~2-3 minutes
- 🧠 **Memory**: Optimized memory usage with chunked processing
- 🔄 **Reliability**: Built-in error handling and retry mechanisms
- 📱 **Anti-Detection**: Randomized user agents and request patterns

## 📄 License

MIT © 2018-2025 [Touno™](https://github.com/dvgamerr)

---

<div align="center">

**Made with ❤️ in Thailand**

*If this project helps you, please consider giving it a ⭐*

</div>
