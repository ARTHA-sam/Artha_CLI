<<<<<<< HEAD
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
=======
# \ud83d\udce6 Artha CLI - Direct Executable CLI Tool

![GitHub Stars](https://img.shields.io/github/stars/ARTHA-sam/Artha_CLI?style=social)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D12.0.0-brightgreen)
![npm](https://img.shields.io/badge/npm-%3E%3D6.0.0-red)

> **A lightweight, executable Command Line Interface tool** that you can run directly without complex setup.
> Built with Node.js for fast, efficient command-line operations.
>
> 🚀 **Quick Start**: Install once, run anywhere with simple commands.

## 📋 Overview

Artha CLI is a powerful command-line interface tool designed for developers who need quick, direct access to powerful functionality. With zero configuration required, simply install and run. The CLI supports multiple commands and options for various operations.

**Key Philosophy**: Keep it simple, keep it fast, keep it direct.

## ✨ Features

- 📝 **Direct Execution** - Run commands immediately after installation
- 🚀 **Lightweight** - Minimal dependencies, fast startup time
- 🎯 **Easy to Use** - Intuitive command structure
- ⚙️ **No Configuration** - Works out of the box
- 🌍 **Cross-Platform** - Works on Windows, macOS, and Linux
- 📚 **Well Documented** - Clear help messages and examples
- 🔧 **Extensible** - Easy to add new commands and features
- ⚡ **Performance Optimized** - Fast execution and minimal overhead

## 🛠️ Tech Stack

- **Runtime**: Node.js (v12.0.0+)
- **Language**: JavaScript (100%)
- **Package Manager**: npm
- **CLI Framework**: Custom Node.js implementation
- **Dependencies**: Minimal, lightweight packages

## 🚀 Quick Start

### Prerequisites

- Node.js 12.0.0 or higher
- npm 6.0.0 or higher
- Git (for cloning)

### Installation

```bash
# Clone the repository
git clone https://github.com/ARTHA-sam/Artha_CLI.git

# Navigate to the project directory
cd Artha_CLI

# Install dependencies
npm install

# Make the CLI executable
chmod +x bin/artha

# Or install globally
npm link
```

### Usage

```bash
# Basic command syntax
artha [command] [options]

# Display help
artha --help
artha -h

# Display version
artha --version
artha -v

# Run a specific command
artha command-name [arguments]
```

## 📁 Project Structure

```
Artha_CLI/
├── bin/                    # Executable scripts
│   ├── artha              # Main CLI entry point
│   └── artha.js           # Wrapper script
├── lib/                    # Core library files
│   ├── commands/          # Command implementations
│   ├── utils/             # Utility functions
│   ├── index.js           # Main library export
│   └── cli.js             # CLI handler
├── node_modules/          # Dependencies
├── package.json           # Project configuration
├── package-lock.json      # Dependency lock file
└── README.md              # This file
```

## 🤝 Contributing

Contributions are welcome! Follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Author

- [@ARTHA-sam](https://github.com/ARTHA-sam) - Original Author

---

**Made with ❤️ by ARTHA**

⭐ **If you find this CLI helpful, please star the repository!**

[Report Bug](https://github.com/ARTHA-sam/Artha_CLI/issues) • [Request Feature](https://github.com/ARTHA-sam/Artha_CLI/discussions) • [View Source](https://github.com/ARTHA-sam/Artha_CLI)
>>>>>>> 3fd2662e13a22ac610d409a8af3a7c2f8da443e4
