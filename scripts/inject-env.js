#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
function loadEnvFile() {
    const envPath = path.join(__dirname, '..', '.env');

    if (!fs.existsSync(envPath)) {
        console.error('❌ .env file not found. Please create one based on .env.example');
        process.exit(1);
    }

    const envFile = fs.readFileSync(envPath, 'utf8');
    const envVars = {};

    envFile.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
                envVars[key.trim()] = valueParts.join('=').trim();
            }
        }
    });

    return envVars;
}

// Replace placeholders in file content
function replacePlaceholders(content, envVars) {
    let updatedContent = content;

    // Replace {{VARIABLE_NAME}} placeholders with actual values
    Object.keys(envVars).forEach(key => {
        const placeholder = `{{${key}}}`;
        const value = envVars[key];
        updatedContent = updatedContent.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });

    return updatedContent;
}

// Process files recursively
function processFiles(sourceDir, targetDir, envVars) {
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const files = fs.readdirSync(sourceDir);

    files.forEach(file => {
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(targetDir, file);
        const stat = fs.statSync(sourcePath);

        if (stat.isDirectory()) {
            processFiles(sourcePath, targetPath, envVars);
        } else if (stat.isFile()) {
            const content = fs.readFileSync(sourcePath, 'utf8');
            const processedContent = replacePlaceholders(content, envVars);
            fs.writeFileSync(targetPath, processedContent, 'utf8');
        }
    });
}

// Main execution
function main() {
    console.log('🔧 Injecting environment variables...');

    try {
        const envVars = loadEnvFile();
        const sourceDir = path.join(__dirname, '..', 'src', 'js');
        const targetDir = path.join(__dirname, '..', 'public', 'js');

        // Clean target directory
        if (fs.existsSync(targetDir)) {
            fs.rmSync(targetDir, { recursive: true, force: true });
        }

        processFiles(sourceDir, targetDir, envVars);

        console.log('✅ Environment variables injected successfully');

        // Verify critical Firebase config values were replaced
        const firebaseFile = path.join(targetDir, 'modules', 'firebase.js');
        if (fs.existsSync(firebaseFile)) {
            const content = fs.readFileSync(firebaseFile, 'utf8');
            if (content.includes('{{')) {
                console.warn('⚠️  Warning: Some placeholders were not replaced. Check your .env file.');
            }
        }

    } catch (error) {
        console.error('❌ Error injecting environment variables:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { loadEnvFile, replacePlaceholders, processFiles };