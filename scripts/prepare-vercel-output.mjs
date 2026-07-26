import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const clientDir = path.resolve(repoRoot, 'dist/client');
const outputDir = path.resolve(repoRoot, 'dist');
const assetsDir = path.resolve(outputDir, 'assets');

mkdirSync(assetsDir, { recursive: true });

if (existsSync(path.join(clientDir, 'favicon.ico'))) {
  copyFileSync(path.join(clientDir, 'favicon.ico'), path.join(outputDir, 'favicon.ico'));
}

const clientAssetsDir = path.join(clientDir, 'assets');
for (const entry of readdirSync(clientAssetsDir, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  copyFileSync(path.join(clientAssetsDir, entry.name), path.join(assetsDir, entry.name));
}

const assets = readdirSync(assetsDir).filter((name) => !name.startsWith('.'));
const cssFile = assets.find((name) => name.endsWith('.css') && name.startsWith('styles-')) ?? assets.find((name) => name.endsWith('.css'));
const jsFile = assets.find((name) => name.endsWith('.js') && name.startsWith('index-')) ?? assets.find((name) => name.endsWith('.js'));

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="KSP-INTELLINET | SCRB Command Center" />
    <title>KSP-INTELLINET | SCRB Command Center</title>
    ${cssFile ? `<link rel="stylesheet" href="/assets/${cssFile}" />` : ''}
    <link rel="icon" href="/favicon.ico" />
  </head>
  <body>
    <div id="root"></div>
    ${jsFile ? `<script type="module" src="/assets/${jsFile}"></script>` : ''}
  </body>
</html>
`;

writeFileSync(path.join(outputDir, 'index.html'), html, 'utf8');
