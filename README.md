# Blackwell Bank Card Hub MCP App

A ChatGPT Apps / MCP demo for a retail banking card experience. The app opens on a Card Hub and lets users move between product discovery, comparison, eligibility, spend insights, merchant offers, travel notices, card controls, and wallet provisioning.

Public deployment:

```text
https://bank.myareareport.com/mcp
```

The VPS deployment is isolated from the existing `mcp.myareareport.com` service. This app runs in its own Docker Compose service named `mcp-bank` and is bound locally on `127.0.0.1:3002`.

## Features

- Card Hub-first embedded UI with persistent customer/card context.
- Product catalogue with card details, rewards calculator, balance transfer estimator, and eligibility flow.
- Mobile tabs for `Cards`, `Compare`, and `Eligibility`.
- Visual comparison summary for travel, everyday spend, and credit building.
- Servicing tools for spend insights, merchant offers, travel notices, card controls, and digital wallet.
- App-only MCP tools for UI navigation and interactive state changes.
- Streamable HTTP transport for hosted MCP clients.
- Stdio transport for local desktop MCP clients.

## Requirements

- Node.js 22 recommended, Node.js 18+ minimum.
- npm.
- Docker and Docker Compose for VPS/container deployment.

## Local Setup

```bash
git clone https://github.com/meabs/mcp-app-ui-bank.git
cd mcp-app-ui-bank
npm install
npm run build
npm start
```

The local MCP endpoint runs at:

```text
http://localhost:3001/mcp
```

For development watch mode:

```bash
npm run dev
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run build` | Build the single-file app bundle with Vite. |
| `npm start` | Build and start the Streamable HTTP MCP server. |
| `npm run start:stdio` | Start the MCP server over stdio. |
| `npm run dev` | Watch-build the UI and restart the server on changes. |
| `npm test` | Run the Node test suite. |

## Testing

Run the automated tests:

```bash
npm test
```

Build the app:

```bash
npm run build
```

Check production dependencies:

```bash
npm audit --omit=dev
```

Verify a running MCP endpoint:

```bash
curl -fsS http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1"}},"id":1}'
```

List tools:

```bash
curl -fsS http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":2}'
```

## Public MCP URL

Use this endpoint when adding the app to a ChatGPT MCP-capable project or tool configuration:

```text
https://bank.myareareport.com/mcp
```

The deployed server should report:

```text
Blackwell Bank Card Services
```

## Docker Deployment

The included Compose file builds the app and exposes the container only on localhost:

```bash
docker compose up -d --build
```

Container mapping:

```text
mcp-bank: 127.0.0.1:3002 -> 3001/tcp
```

Cloudflare Tunnel routes `bank.myareareport.com` to `http://localhost:3002`.

## Key Files

| File | Purpose |
|---|---|
| `src/index.js` | Streamable HTTP and stdio transport setup. |
| `src/server.js` | MCP tool and resource registrations. |
| `src/demo-data.js` | Demo card, hub, eligibility, spend, wallet, and offer data. |
| `src/mcp-app.html` | Embedded app shell and view containers. |
| `src/mcp-app.js` | App state, routing, host integration, and product flow rendering. |
| `src/feature-views.js` | Hub, compare, servicing, calculator, and journey renderers. |
| `src/mcp-app.css` | Embedded app visual system and responsive layout. |
| `docker-compose.yml` | Isolated VPS service definition for `mcp-bank`. |

## Current Verification

Latest known-good checks:

```bash
npm test
npm run build
npm audit --omit=dev
```

The deployed endpoint at `https://bank.myareareport.com/mcp` initializes and exposes the Blackwell Bank tools.
