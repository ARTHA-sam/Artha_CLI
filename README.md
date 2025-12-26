# ARTHA CLI

Interactive command-line tool for ARTHA framework.

## Installation

```bash
cd cli
npm install
npm link   # Makes 'artha' command available globally
```

## Commands

### 🆕 Create New Project
```bash
artha new my-app
cd my-app
```

### 🗄️ Add Database (Interactive!)
```bash
artha add sql

? Select database type:
  ❯ 💎 SQLite (Lightweight, no server needed)
    🐬 MySQL (Popular, production-ready)
    🐘 PostgreSQL (Advanced features)

√ SQLite selected!

? Database name: [app.db]

✓ Updated artha.json
✓ Added SQLite configuration
```

Supports fuzzy matching:
- `artha add sql` ✅
- `artha add sq` ✅  
- `artha add database` ✅
- `artha add db` ✅

### 🚀 Run Development Server
```bash
artha dev

# Or specify port
artha dev -p 3000
```

### 📦 Add Dependencies
```bash
artha add lombok
artha add gson --version 2.10.1
```

### 🏗️ Build
```bash
artha build
```

## Features

- ✨ Interactive prompts (like create-react-app)
- 🔍 Fuzzy command matching
- 🔄 Hot reload on file changes
- 🎨 Beautiful terminal output
- 📦 Automatic dependency management
- 🛠️ IDE configuration (IntelliJ + VS Code)
