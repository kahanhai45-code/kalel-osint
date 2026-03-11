# KAL-EL OSINT SYSTEM v2.3

**Military-Grade Open Source Intelligence Platform**

A comprehensive real-time intelligence system for geopolitical analysis, aerial surveillance, IP geolocation, camera monitoring, and AI-powered OSINT operations.

## Features

### Command Center (Dashboard)
- Real-time KPI monitoring (connectors, threat level, latency, AI models)
- Live data flow chart (24h)
- API connector diagnostics (OpenSky, IPInfo, Shodan, VirusTotal, OpenRouter, AbuseIPDB)
- Operations log with severity levels

### Intel Map (Tactical Map)
- Live aircraft tracking via OpenSky Network
- IP geolocation with interactive markers
- 20+ public cameras across Middle East (Jerusalem, Tehran, Beirut, Baghdad, Damascus)
- Region filtering and Middle East quick-zoom
- Discovered camera overlay with clustering

### Middle East Analysis
- 12 countries monitored: Israel, Iran, Lebanon, Syria, Iraq, Yemen, Saudi Arabia, Egypt, Jordan, Turkey, UAE, Qatar
- Military intelligence: armed forces, nuclear status, key bases
- Geopolitical tabs: Overview, Military, Intelligence, Events
- AI-powered analysis via Gemini (OpenRouter)
- Live alert feed with severity classification

### AI Agent (OSINT Chat)
- Streaming AI responses via OpenRouter
- Multiple model support (Gemini, Llama, Mistral, Gemma)
- OSINT-specialized system prompts

### Intel Core (Data Correlation)
- Multi-source OSINT correlation
- IP/Domain/Email investigation
- Threat scoring and entity extraction
- 8 configurable data sources

### Eye of Kal-El (Scanner)
- IP camera discovery
- Intensity control and auto-scan
- CSV export and map integration

### Code Forge
- AI-powered code optimization
- 6 modes: Optimize, Secure, Refactor, Document, Modernize, Translate
- Split-screen editor

## Multilingual Support
- English
- Francais
- Hebrew (with RTL support)

## Tech Stack
- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + Vite 7
- **Charts**: Recharts
- **Maps**: Leaflet + MarkerCluster
- **Animations**: Framer Motion
- **State**: Zustand
- **AI**: OpenRouter API (Gemini, Llama, Mistral)
- **APIs**: OpenSky, IPInfo, Shodan, VirusTotal, AbuseIPDB

## Deployment

### Cloudflare Pages
1. Connect this repo to Cloudflare Pages
2. Build command: `npx vite build`
3. Build output directory: `dist/public`
4. Root directory: `kalel-osint-webapp` (if monorepo)

### Local Development
```bash
pnpm install
pnpm dev
```

## License
Proprietary - All rights reserved

## Author
Kal-El Intelligence Systems
