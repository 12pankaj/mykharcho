const fs = require('fs');
const path = require('path');

const directory = 'd:/expence/web-app/src';

const replacements = {
    'emerald-500': 'orange-600',
    'emerald-400': 'orange-500',
    'emerald-600': 'orange-700',
    'emerald-50': 'orange-50',
    'emerald-900': 'orange-900',
    'emerald-': 'orange-', // catch-all
    'text-emerald': 'text-orange',
    'bg-[#020617]': 'bg-[#08172c]',
    'slate-900': 'slate-950', // darker for better contrast with orange
    '#10B981': '#c1522d',
    '#0B132B': '#08172c',
    '#020617': '#08172c',
    'from-emerald': 'from-orange',
    'to-emerald': 'to-orange',
    'via-emerald': 'via-orange'
};

function processDirectory(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            for (const [search, replace] of Object.entries(replacements)) {
                if (content.includes(search)) {
                    content = content.split(search).join(replace);
                    modified = true;
                }
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    });
}

processDirectory(directory);
console.log("Done replacing colors in web-app.");
