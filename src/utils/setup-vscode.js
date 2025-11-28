#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

// Find runtime JAR
function findRuntimeJar() {
    const possiblePaths = [
        'C:\\Users\\samar\\Downloads\\artha\\runtime\\target',
        path.join(__dirname, '..', '..', 'runtime', 'target')
    ];

    for (const runtimePath of possiblePaths) {
        if (fs.existsSync(runtimePath)) {
            const files = fs.readdirSync(runtimePath);
            const jarFile = files.find(f =>
                f.startsWith('artha-runtime') &&
                f.endsWith('.jar') &&
                !f.endsWith('-sources.jar')
            );
            if (jarFile) {
                return path.join(runtimePath, jarFile).replace(/\\/g, '/');
            }
        }
    }
    return null;
}

const runtimeJar = findRuntimeJar();

if (!runtimeJar) {
    console.log('❌ Runtime JAR not found!');
    process.exit(1);
}

// Create .vscode/settings.json in current directory
const vscodePath = path.join(process.cwd(), '.vscode');
fs.ensureDirSync(vscodePath);

const settings = {
    "java.project.sourcePaths": ["src"],
    "java.project.outputPath": "build",
    "java.project.referencedLibraries": [
        ".artha/lib/**/*.jar",
        runtimeJar
    ]
};

fs.writeJsonSync(
    path.join(vscodePath, 'settings.json'),
    settings,
    { spaces: 4 }
);

console.log('✅ Created .vscode/settings.json');
console.log('📍 Runtime JAR:', runtimeJar);
console.log('\n🔄 Now reload VS Code: Ctrl+Shift+P → "Reload Window"');
