const setupVSCode = require('./utils/setup-vscode');

async function setupCommand() {
    try {
        await setupVSCode();
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

module.exports = setupCommand;
