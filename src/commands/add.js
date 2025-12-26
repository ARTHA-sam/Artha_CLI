const fs = require('fs-extra');
const chalk = require('chalk');
const inquirer = require('inquirer');
const DependencyManager = require('../utils/dependency-manager');

async function addCommand(feature, options) {
    // Fuzzy matching for 'sql' or 'database'
    const sqlAliases = ['sql', 'sq', 'database', 'db'];
    
    if (sqlAliases.some(alias => feature.toLowerCase().startsWith(alias.substring(0, Math.min(feature.length, alias.length))))) {
        return await addDatabase();
    }
    
    // Default: treat as dependency package
    return await addDependency(feature, options?.version);
}

async function addDatabase() {
    console.log(chalk.cyan('\n📦 Database Configuration Setup\n'));
    
    if (!await fs.pathExists('artha.json')) {
        console.log(chalk.red('❌ No artha.json found! Run this in your project directory.'));
        process.exit(1);
    }

    // Interactive prompts
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'driver',
            message: 'Select database type:',
            choices: [
                {
                    name: '💎 SQLite (Lightweight, no server needed)',
                    value: 'sqlite',
                    short: 'SQLite'
                },
                {
                    name: '🐬 MySQL (Popular, production-ready)',
                    value: 'mysql',
                    short: 'MySQL'
                },
                {
                    name: '🐘 PostgreSQL (Advanced features)',
                    value: 'postgresql',
                    short: 'PostgreSQL'
                }
            ]
        }
    ]);

    const { driver } = answers;
    console.log(chalk.green(`\n√ ${driver} selected!\n`));

    let dbConfig = { driver };

    // Driver-specific configuration
    if (driver === 'sqlite') {
        const sqliteAnswers = await inquirer.prompt([
            {
                type: 'input',
                name: 'dbName',
                message: 'Database name:',
                default: 'app.db'
            }
        ]);
        dbConfig.name = sqliteAnswers.dbName;
    } else if (driver === 'mysql') {
        const mysqlAnswers = await inquirer.prompt([
            {
                type: 'input',
                name: 'host',
                message: 'Host:',
                default: 'localhost'
            },
            {
                type: 'input',
                name: 'port',
                message: 'Port:',
                default: '3306'
            },
            {
                type: 'input',
                name: 'dbName',
                message: 'Database name:',
                default: 'mydb'
            },
            {
                type: 'input',
                name: 'username',
                message: 'Username:',
                default: 'root'
            },
            {
                type: 'password',
                name: 'password',
                message: 'Password:',
                mask: '*'
            }
        ]);
        dbConfig.host = mysqlAnswers.host;
        dbConfig.port = parseInt(mysqlAnswers.port);
        dbConfig.name = mysqlAnswers.dbName;
        dbConfig.username = mysqlAnswers.username;
        dbConfig.password = mysqlAnswers.password;
    } else if (driver === 'postgresql') {
        const pgAnswers = await inquirer.prompt([
            {
                type: 'input',
                name: 'host',
                message: 'Host:',
                default: 'localhost'
            },
            {
                type: 'input',
                name: 'port',
                message: 'Port:',
                default: '5432'
            },
            {
                type: 'input',
                name: 'dbName',
                message: 'Database name:',
                default: 'mydb'
            },
            {
                type: 'input',
                name: 'username',
                message: 'Username:',
                default: 'postgres'
            },
            {
                type: 'password',
                name: 'password',
                message: 'Password:',
                mask: '*'
            }
        ]);
        dbConfig.host = pgAnswers.host;
        dbConfig.port = parseInt(pgAnswers.port);
        dbConfig.name = pgAnswers.dbName;
        dbConfig.username = pgAnswers.username;
        dbConfig.password = pgAnswers.password;
    }

    // Update artha.json
    const config = await fs.readJson('artha.json');
    config.database = dbConfig;
    
    await fs.writeJson('artha.json', config, { spaces: 2 });
    
    console.log(chalk.green('\n✓ Updated artha.json'));
    console.log(chalk.green('✓ Added database configuration\n'));
    
    console.log(chalk.cyan('Your artha.json now includes:'));
    console.log(chalk.gray(JSON.stringify({ database: dbConfig }, null, 2)));
    
    // Add driver dependency
    const driverVersions = {
        'sqlite': '3.44.1.0',
        'mysql': '8.2.0',
        'postgresql': '42.7.1'
    };
    
    const driverPackages = {
        'sqlite': 'sqlite-jdbc',
        'mysql': 'mysql-connector-java',
        'postgresql': 'postgresql'
    };
    
    const packageName = driverPackages[driver];
    const version = driverVersions[driver];
    
    if (!config.dependencies) config.dependencies = {};
    config.dependencies[packageName] = version;
    
    await fs.writeJson('artha.json', config, { spaces: 2 });
    
    console.log(chalk.green(`\n✓ Added ${packageName}@${version} to dependencies`));
    
    // Install dependencies
    const depManager = new DependencyManager(process.cwd());
    await depManager.install();
    
    console.log(chalk.cyan('\n💡 Run your app:\n  artha dev\n'));
}

async function addDependency(packageName, version) {
    console.log(chalk.cyan(`\n📦 Adding ${packageName}...\n`));
    
    if (!await fs.pathExists('artha.json')) {
        console.log(chalk.red('❌ No artha.json found!'));
        process.exit(1);
    }

    // Validate version format
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (version && !versionRegex.test(version)) {
        console.log(chalk.yellow(`⚠️  Invalid version format: "${version}". Using latest version instead.`));
        version = null;
    }

    const config = await fs.readJson('artha.json');
    if (!config.dependencies) config.dependencies = {};
    if (!version) version = await getLatestVersion(packageName);

    config.dependencies[packageName] = version;
    await fs.writeJson('artha.json', config, { spaces: 2 });
    console.log(chalk.green(`✅ Added ${packageName}@${version} to artha.json`));

    const depManager = new DependencyManager(process.cwd());
    await depManager.install();

    console.log(chalk.cyan('\n💡 Restart your server:\n  artha dev\n'));
}

async function getLatestVersion(packageName) {
    const LATEST = {
        'postgresql': '42.7.1',
        'mysql': '8.2.0',
        'mysql-connector-java': '8.2.0',
        'sqlite-jdbc': '3.44.1.0',
        'redis': '4.3.1',
        'lombok': '1.18.30',
        'gson': '2.10.1',
        'jwt': '4.4.0',
        'mongodb': '4.11.1'
    };
    return LATEST[packageName] || '1.0.0';
}

module.exports = addCommand;
