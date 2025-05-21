const { readFile } = require('fs').promises;
const { resolve } = require('path');

async function loadConfig() {
  try {
    const configPath = resolve('./ecosystem.config.js');
    const configContent = await readFile(configPath, 'utf8');
    const modifiedContent = configContent
      .replace('export default', 'module.exports =')
      .replace(/import\s+.*\s+from\s+['"].*['"];?/g, '');
    
    // Use eval in a controlled way to load the configuration
    const config = eval('(' + modifiedContent + ')');
    return config;
  } catch (error) {
    console.error('Error loading PM2 config:', error);
    process.exit(1);
  }
}

// Export the async function result
module.exports = loadConfig(); 