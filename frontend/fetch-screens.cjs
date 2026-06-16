const fs = require('fs');
const path = require('path');
const https = require('https');

const screens = [
    { name: 'Marketplace', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzg3YzExOWUyNThjNTRjZDVhMjFiYTI3MzZmNmU0ZWU3EgsSBxCXpLC0oQkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMzU0NDE3NjI4MjQyNDM4MDE1MQ&filename=&opi=89354086' },
    { name: 'Home', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzYzYzE3MDRkYTcxODQ4NTVhNDFhNTE5OTNhOWRiMTdjEgsSBxCXpLC0oQkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMzU0NDE3NjI4MjQyNDM4MDE1MQ&filename=&opi=89354086' },
    { name: 'ProductDetail', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzdmNzUzOWZiOWUyZTQ4Yzc5YTdhZmZjNTU3NGM3NjU1EgsSBxCXpLC0oQkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMzU0NDE3NjI4MjQyNDM4MDE1MQ&filename=&opi=89354086' },
    { name: 'AdminDashboard', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2IzYjdlNGUxMDgzNjQ3YmE4YjNiNTYwZjkyOGM2OTk1EgsSBxCXpLC0oQkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMzU0NDE3NjI4MjQyNDM4MDE1MQ&filename=&opi=89354086' },
    { name: 'Profile', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzJhOTZkMTNlNzRkODQzNzc5YThhNWFjMWQ0NDQ5NWVkEgsSBxCXpLC0oQkYAZIBJAoKcHJvamVjdF9pZBIWQhQxMzU0NDE3NjI4MjQyNDM4MDE1MQ&filename=&opi=89354086' }
];

const pagesDir = path.join(__dirname, 'src', 'pages');
if (!fs.existsSync(pagesDir)) {
    fs.mkdirSync(pagesDir, { recursive: true });
}

function downloadHtml(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function htmlToReact(html, componentName) {
    // Extract body content
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    let content = bodyMatch ? bodyMatch[1] : html;

    // Convert common HTML attributes to JSX
    content = content.replace(/class=/g, 'className=')
                     .replace(/for=/g, 'htmlFor=')
                     .replace(/<!--[\s\S]*?-->/g, '{/* comment */}');

    // Make self closing tags for inputs and imgs
    content = content.replace(/<(input|img|hr|br|meta|link)([^>]*?)>/g, (match, tag, attrs) => {
        if (attrs.trim().endsWith('/')) return match;
        return `<${tag}${attrs} />`;
    });

    // Inline styles (basic fix, usually styles are string in HTML but object in React)
    // Actually, converting all inline styles is complex, so let's just strip inline styles for safety if they are complex, or leave them and let developer fix it. We'll replace style="..." with style={{}} for simple ones, but it might break. So we'll just ignore them for this automated script and manually fix later if needed.
    content = content.replace(/style="([^"]*)"/g, (match, p1) => {
        const rules = p1.split(';').filter(r => r.trim());
        const styleObj = rules.map(rule => {
            let [key, val] = rule.split(':');
            if(!key || !val) return '';
            key = key.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
            return `${key}: '${val.trim().replace(/'/g, "\\'")}'`;
        }).filter(Boolean).join(', ');
        return `style={{ ${styleObj} }}`;
    });
    
    // Some SVG fixes
    content = content.replace(/fill-rule/g, 'fillRule')
                     .replace(/clip-rule/g, 'clipRule')
                     .replace(/stroke-width/g, 'strokeWidth')
                     .replace(/stroke-linecap/g, 'strokeLinecap')
                     .replace(/stroke-linejoin/g, 'strokeLinejoin');

    return `import React from 'react';\nimport { Link } from 'react-router-dom';\n\nconst ${componentName} = () => {\n  return (\n    <div className="ecotrade-screen">\n      ${content}\n    </div>\n  );\n};\n\nexport default ${componentName};\n`;
}

async function processScreens() {
    for (const screen of screens) {
        console.log(`Downloading ${screen.name}...`);
        try {
            const html = await downloadHtml(screen.url);
            const reactCode = htmlToReact(html, screen.name);
            fs.writeFileSync(path.join(pagesDir, `${screen.name}.jsx`), reactCode);
            console.log(`Saved ${screen.name}.jsx`);
        } catch (e) {
            console.error(`Failed to process ${screen.name}`, e);
        }
    }
}

processScreens();
