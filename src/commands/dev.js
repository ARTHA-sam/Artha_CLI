const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const chokidar = require('chokidar');
const chalk = require('chalk');
const ora = require('ora');
const DependencyManager = require('../utils/dependency-manager');

let javaProcess = null;
let isRestarting = false;
const isWindows = process.platform === 'win32';

async function devCommand(options) {
    console.log(chalk.cyan('\n🚀 ARTHA Development Server\n'));

    if (!fs.existsSync('artha.json')) {
        console.log(chalk.red('❌ No artha.json found!'));
        return process.exit(1);
    }

    const config = await fs.readJson('artha.json');
    const jsonPort = config.server?.port;

    // Priority: command line option > artha.json port > default 8080
    // Parse to int if provided as string from CLI
    const cliPort = options.port ? parseInt(options.port, 10) : undefined;
    const port = cliPort || jsonPort || 8080;
    const srcDir = config.srcDir || 'src';

    // Debug output for your verification
    console.log('DEBUG: CLI current folder:', process.cwd());
    console.log('DEBUG: options.port (raw):', options.port);
    console.log('DEBUG: Detected artha.json port:', jsonPort);
    console.log('DEBUG: Final port value:', port);

    // Dependency JARs
    const depManager = new DependencyManager(process.cwd());
    const dependencyJars = await depManager.install();

    const runtimeJar = findRuntimeJar();
    if (!runtimeJar) {
        console.log(chalk.red('❌ ARTHA runtime not found!'));
        return process.exit(1);
    }

    await compileAndStart(srcDir, runtimeJar, port, dependencyJars);

    console.log(chalk.gray('\n👀 Watching for changes... (Press Ctrl+C to stop)\n'));

    const watcher = chokidar.watch(`${srcDir}/**/*.java`, {
        ignored: /(^|[\/\\])\../,
        persistent: true
    });

    watcher.on('change', async (filePath) => {
        if (isRestarting) {
            console.log(chalk.gray('⏳ Already restarting, please wait...'));
            return;
        }

        isRestarting = true;
        console.log(chalk.yellow(`\n📝 File changed: ${filePath}`));

        if (javaProcess) {
            await killServerGracefully();
        }

        await compileAndStart(srcDir, runtimeJar, port, dependencyJars);
        isRestarting = false;
    });

    process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n\n👋 Stopping ARTHA server...'));
        if (javaProcess) await killServerGracefully();
        watcher.close();
        process.exit(0);
    });
}

async function killServerGracefully() {
    return new Promise((resolve) => {
        if (!javaProcess) {
            resolve();
            return;
        }

        javaProcess.on('exit', () => {
            javaProcess = null;
            resolve();
        });

        // Kill the process
        if (isWindows) {
            spawn('taskkill', ['/pid', javaProcess.pid, '/f', '/t']);
        } else {
            javaProcess.kill('SIGTERM');
        }

        // Force kill after 3 seconds if still running
        setTimeout(() => {
            if (javaProcess) {
                javaProcess.kill('SIGKILL');
                javaProcess = null;
            }
            resolve();
        }, 3000);
    });
}

async function compileAndStart(srcDir, runtimeJar, port, dependencyJars = []) {
    const spinner = ora('Compiling...').start();
    try {
        await fs.ensureDir('build');
        const javaFiles = await findJavaFiles(srcDir);
        if (javaFiles.length === 0) {
            spinner.fail(chalk.red('No Java files found in ' + srcDir));
            return;
        }
        await compile(javaFiles, runtimeJar, dependencyJars);
        spinner.succeed(chalk.green('Compiled successfully'));
        await new Promise(resolve => setTimeout(resolve, 500));
        startServer(runtimeJar, port, dependencyJars);
    } catch (error) {
        spinner.fail(chalk.red('Compilation failed'));
        console.log(chalk.red('\n' + error.message));
    }
}

function compile(javaFiles, runtimeJar, dependencyJars = []) {
    return new Promise((resolve, reject) => {
        const filesArg = javaFiles.join(' ');
        const allJars = [runtimeJar, ...dependencyJars];
        const classpath = allJars.join(isWindows ? ';' : ':');

        // EXPANDED JVM FLAGS: Necessary for Lombok compatibility with JDK 21+
        const jvmFlags = [
            '--add-opens=java.base/java.lang=ALL-UNNAMED',
            '--add-opens=java.base/java.util=ALL-UNNAMED',
            '--add-opens=jdk.compiler/com.sun.tools.javac.api=ALL-UNNAMED',
            '--add-opens=jdk.compiler/com.sun.tools.javac.code=ALL-UNNAMED',
            '--add-opens=jdk.compiler/com.sun.tools.javac.comp=ALL-UNNAMED',
            '--add-opens=jdk.compiler/com.sun.tools.javac.file=ALL-UNNAMED',
            '--add-opens=jdk.compiler/com.sun.tools.javac.jvm=ALL-UNNAMED',
            '--add-opens=jdk.compiler/com.sun.tools.javac.main=ALL-UNNAMED',
            '--add-opens=jdk.compiler/com.sun.tools.javac.model=ALL-UNNAMED',
            '--add-opens=jdk.compiler/com.sun.tools.javac.parser=ALL-UNNAMED',
            '--add-opens=jdk.compiler/com.sun.tools.javac.processing=ALL-UNNAMED',
            '--add-opens=jdk.compiler/com.sun.tools.javac.tree=ALL-UNNAMED',
            '--add-opens=jdk.compiler/com.sun.tools.javac.util=ALL-UNNAMED'
        ];

        const javacArgs = [
            ...jvmFlags.map(f => '-J' + f),
            '-cp', classpath,
            '-processorpath', classpath,
            '-d', 'build',
            ...javaFiles
        ];

        // Debug: Print args to verify
        console.log('DEBUG: javac args count:', javacArgs.length);

        const javac = spawn('javac', javacArgs, { stdio: ['pipe', 'pipe', 'pipe'] });
        let stderr = '';
        javac.stderr.on('data', (d) => { stderr += d.toString(); });
        javac.on('close', (code) => {
            if (code !== 0) reject(new Error(stderr)); else resolve();
        });
    });
}

function startServer(runtimeJar, port, dependencyJars = []) {
    const allJars = [runtimeJar, 'build', ...dependencyJars];
    const classpath = isWindows ? allJars.join(';') : allJars.join(':');
    // Print the exact Java command for debugging!
    console.log("DEBUG: Java CMD: java", `-Dartha.port=${port}`, '-cp', `"${classpath}"`, 'dev.artha.core.Runtime');

    javaProcess = spawn('java', [
        `-Dartha.port=${port}`,
        // Add some opens for runtime reflection (optional but often needed)
        '--add-opens=java.base/java.lang=ALL-UNNAMED',
        '--add-opens=java.base/java.util=ALL-UNNAMED',
        '-cp',
        classpath,
        'dev.artha.core.Runtime'
    ], {
        stdio: 'inherit'
    });

    javaProcess.on('error', (error) => {
        console.log(chalk.red('❌ Failed to start server:'), error.message);
    });

    javaProcess.on('exit', (code) => {
        if (code !== 0 && code !== null && !isRestarting) {
            console.log(chalk.red(`\n❌ Server stopped with code ${code}`));
        }
    });
}

function findRuntimeJar() {
    const possiblePaths = [
        // Bundled JAR (Priority for distribution)
        path.join(__dirname, '..', '..', 'lib', 'artha-runtime.jar'),
        // Development paths
        path.join(process.cwd(), '..', '..', 'runtime', 'target'),
        path.join(process.cwd(), '..', 'runtime', 'target'),
        path.join(process.cwd(), 'runtime', 'target'),
        path.join(__dirname, '..', '..', '..', 'runtime', 'target'),
        'C:\\Coding\\Java\\Spring\\artha\\runtime\\target'
    ];
    for (const runtimePath of possiblePaths) {
        // Check if it's a direct file path (bundled) or a directory (dev)
        if (runtimePath.endsWith('.jar')) {
            if (fs.existsSync(runtimePath)) {
                console.log(chalk.green(`✅ Found runtime: ${runtimePath}`));
                return runtimePath;
            }
        } else if (fs.existsSync(runtimePath)) {
            const files = fs.readdirSync(runtimePath);
            const jarFile = files.find(f =>
                f.startsWith('artha-runtime') &&
                f.endsWith('.jar') &&
                !f.endsWith('-sources.jar') &&
                !f.endsWith('-javadoc.jar')
            );
            if (jarFile) {
                console.log(chalk.green(`✅ Found runtime: ${jarFile}`));
                return path.join(runtimePath, jarFile);
            }
        }
    }
    return null;
}

async function findJavaFiles(dir) {
    const files = [];
    async function scan(directory) {
        const items = await fs.readdir(directory);
        for (const item of items) {
            const fullPath = path.join(directory, item);
            const stat = await fs.stat(fullPath);
            if (stat.isDirectory()) {
                await scan(fullPath);
            } else if (item.endsWith('.java')) {
                files.push(fullPath);
            }
        }
    }
    await scan(dir);
    return files;
}

module.exports = devCommand;
