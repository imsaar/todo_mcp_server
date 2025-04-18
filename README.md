# Todo MCP Server

A simple todo model context protocol (MCP) server built with TypeScript SDK.

## Features

- Add and delete todo items
- Mark todos as complete
- Get all todos

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Development

Run the development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

## Testing with mcp-inspector

1. Install mcp-inspector (if not already installed):
```bash
npm install -g @modelcontext/mcp-inspector
```

2. Build your MCP server:
```bash
npm run build
```

3. In a new terminal, inspect the server:
```bash
mcp-inspector node /path/to/repo/build/index.js
```

## Local MCP Server Installation

To use this MCP server in other local projects:

1. Build the server:
```bash
npm run build
```

2. Link the package locally:
```bash
npm link
```

3. Configure your project's mcp.config.json:
```json
{
  "mcpServers": {
    // ...
    "todo": {
      "command": "node",
      "args": [
        "/path/to/repo/build/index.js"
      ]
    }
  }
}
```

## Project Structure

- `src/` - Contains all source files
  - `index.ts` - Main application entry point
- `build/` - Contains compiled output (created during build)
- `package.json` - Project configuration and dependencies
- `tsconfig.json` - TypeScript configuration

## Available Scripts

- `dev` - Start development server
- `build` - Build production version
- `watch` - Watch for changes and rebuild
- `clean` - Remove build artifacts
