const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

async function newCommand(projectName, options) {
    console.log(chalk.cyan(`\n🚀 Creating ARTHA project: ${projectName}\n`));

    const projectPath = path.join(process.cwd(), projectName);

    if (fs.existsSync(projectPath)) {
        console.log(chalk.red(`❌ Directory ${projectName} already exists!`));
        process.exit(1);
    }

    try {
        // Create project structure
        await fs.ensureDir(projectPath);
        await fs.ensureDir(path.join(projectPath, 'src'));

        // Find runtime JAR
        const runtimeJar = findRuntimeJar();
        if (!runtimeJar) {
            console.log(chalk.yellow('⚠️  ARTHA runtime not found. IDE support may not work.'));
        }

        // Create artha.json
        const arthaConfig = {
            name: projectName,
            version: "1.0.0",
            srcDir: "src",
            server: {
                port: 8080
            },
            dependencies: {
                "gson": "2.10.1",
                "slf4j-api": "2.0.11",
                "slf4j-simple": "2.0.11",
                "jackson": "2.16.1",
                "jackson-core": "2.16.1",
                "jackson-annotations": "2.16.1"
            }
        };
        await fs.writeJson(
            path.join(projectPath, 'artha.json'),
            arthaConfig,
            { spaces: 2 }
        );

        // Create Hello.java
        const helloJava = `import dev.artha.annotations.Step;
import dev.artha.http.Request;
import dev.artha.http.Response;

@Step(path = "/hello", method = "GET")
public class Hello {
    public String handle() {
        return "Hello from ARTHA! 🚀";
    }
}
`;
        await fs.writeFile(
            path.join(projectPath, 'src', 'Hello.java'),
            helloJava
        );

        // Create .gitignore
        const gitignore = `build/
.artha/
*.class
.idea/workspace.xml
.idea/tasks.xml
`;
        await fs.writeFile(path.join(projectPath, '.gitignore'), gitignore);

        // Create README
        const readme = `# ${projectName}

A simple API built with ARTHA framework.

## Getting Started

\`\`\`bash
# Start development server
artha dev

# Visit http://localhost:8080/hello
\`\`\`

## IDE Setup (IntelliJ)

If you see red underlines on \`@Step\`:

1. Press F4 (Project Structure)
2. Go to: Modules → Dependencies
3. Click + → JARs or directories
4. Select: ${runtimeJar || 'artha-runtime.jar'}
5. Click OK

The annotations will be recognized! ✅

## Learn More

- [ARTHA Documentation](https://github.com/yourname/artha)
`;
        await fs.writeFile(path.join(projectPath, 'README.md'), readme);

        // Create IntelliJ configuration (if runtime found)
        if (runtimeJar) {
            await createIntelliJConfig(projectPath, projectName, runtimeJar);
            await createVSCodeConfig(projectPath, runtimeJar);
        }

        // Success!
        console.log(chalk.green(`✅ Created ${projectName}\n`));
        console.log(chalk.cyan('Next steps:'));
        console.log(chalk.white(`  cd ${projectName}`));
        console.log(chalk.white('  artha dev\n'));

        if (runtimeJar) {
            console.log(chalk.green('✅ IDE support configured (IntelliJ + VS Code)!\n'));
        } else {
            console.log(chalk.yellow('⚠️  IDE support: Manually add runtime JAR (see README.md)\n'));
        }

    } catch (error) {
        console.log(chalk.red(`❌ Failed to create project: ${error.message}`));
        process.exit(1);
    }
}

async function createIntelliJConfig(projectPath, projectName, runtimeJar) {
    // Create .idea directory
    const ideaPath = path.join(projectPath, '.idea');
    await fs.ensureDir(ideaPath);
    await fs.ensureDir(path.join(ideaPath, 'libraries'));

    // Create library configuration
    const libraryXml = `<component name="libraryTable">
  <library name="artha-runtime">
    <CLASSES>
      <root url="jar://${runtimeJar.replace(/\\/g, '/')}!/" />
    </CLASSES>
    <JAVADOC />
    <SOURCES />
  </library>
</component>`;

    await fs.writeFile(
        path.join(ideaPath, 'libraries', 'artha_runtime.xml'),
        libraryXml
    );

    // Create module configuration
    const imlContent = `<?xml version="1.0" encoding="UTF-8"?>
<module type="JAVA_MODULE" version="4">
  <component name="NewModuleRootManager" inherit-compiler-output="true">
    <exclude-output />
    <content url="file://$MODULE_DIR$">
      <sourceFolder url="file://$MODULE_DIR$/src" isTestSource="false" />
      <excludeFolder url="file://$MODULE_DIR$/build" />
    </content>
    <orderEntry type="inheritedJdk" />
    <orderEntry type="sourceFolder" forTests="false" />
    <orderEntry type="library" name="artha-runtime" level="project" />
  </component>
</module>`;

    await fs.writeFile(
        path.join(projectPath, `${projectName}.iml`),
        imlContent
    );

    // Create modules.xml
    const modulesXml = `<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="ProjectModuleManager">
    <modules>
      <module fileurl="file://$PROJECT_DIR$/${projectName}.iml" filepath="$PROJECT_DIR$/${projectName}.iml" />
    </modules>
  </component>
</project>`;

    await fs.writeFile(
        path.join(ideaPath, 'modules.xml'),
        modulesXml
    );

    // Create misc.xml (Java version)
    const miscXml = `<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="ProjectRootManager" version="2" languageLevel="JDK_11" default="true" project-jdk-name="11" project-jdk-type="JavaSDK">
    <output url="file://$PROJECT_DIR$/build" />
  </component>
</project>`;

    await fs.writeFile(
        path.join(ideaPath, 'misc.xml'),
        miscXml
    );
}

async function createVSCodeConfig(projectPath, runtimeJar) {
    // Create .vscode directory
    const vscodePath = path.join(projectPath, '.vscode');
    await fs.ensureDir(vscodePath);

    // Create settings.json
    const settings = {
        "java.project.sourcePaths": ["src"],
        "java.project.outputPath": "build",
        "java.project.referencedLibraries": [
            ".artha/lib/**/*.jar",
            runtimeJar.replace(/\\/g, '/')
        ]
    };

    await fs.writeJson(
        path.join(vscodePath, 'settings.json'),
        settings,
        { spaces: 4 }
    );

    // Create extensions.json
    const extensions = {
        "recommendations": [
            "vscjava.vscode-java-pack"
        ]
    };

    await fs.writeJson(
        path.join(vscodePath, 'extensions.json'),
        extensions,
        { spaces: 4 }
    );
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
                return path.join(runtimePath, jarFile);
            }
        }
    }
    return null;
}

module.exports = newCommand;
