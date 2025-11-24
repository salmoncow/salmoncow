const fs = require('fs');
const path = require('path');

/**
 * Asset Build Pipeline
 * Copies static assets from src/assets to public/assets
 */
class AssetPipeline {
    constructor(config) {
        this.sourceDir = config.sourceDir || './src/assets';
        this.destDir = config.destDir || './public/assets';
    }

    /**
     * Copy assets from source to destination
     */
    copyAssets() {
        console.log('📦 Copying assets from', this.sourceDir, 'to', this.destDir);

        // Ensure destination directory exists
        if (!fs.existsSync(this.destDir)) {
            fs.mkdirSync(this.destDir, { recursive: true });
        }

        // Copy all assets
        this.copyRecursive(this.sourceDir, this.destDir);

        console.log('✅ Assets copied successfully');
    }

    /**
     * Recursively copy directory contents
     */
    copyRecursive(src, dest) {
        // Check if source exists
        if (!fs.existsSync(src)) {
            console.warn(`⚠️  Source directory not found: ${src}`);
            return;
        }

        const entries = fs.readdirSync(src, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
                // Skip README files in asset directories (documentation only)
                if (entry.name === 'README.md') continue;

                // Create directory if it doesn't exist
                if (!fs.existsSync(destPath)) {
                    fs.mkdirSync(destPath, { recursive: true });
                }

                // Recursively copy directory contents
                this.copyRecursive(srcPath, destPath);
            } else {
                // Skip README files (documentation only)
                if (entry.name === 'README.md') continue;

                // Copy file
                fs.copyFileSync(srcPath, destPath);
                console.log(`  ✓ Copied: ${entry.name}`);
            }
        }
    }
}

// Run the asset pipeline
const pipeline = new AssetPipeline({
    sourceDir: './src/assets',
    destDir: './public/assets'
});

pipeline.copyAssets();
