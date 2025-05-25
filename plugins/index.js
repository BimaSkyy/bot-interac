const fs = require('fs');
const path = require('path');

const plugins = [];
const files = fs.readdirSync(__dirname);

for (const file of files) {
    if (file !== 'index.js' && file.endsWith('.js')) {
        const plugin = require(path.join(__dirname, file));
        plugins.push(plugin);
    }
}

module.exports = plugins;
