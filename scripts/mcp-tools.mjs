// The tool reference of the MCP server, vendored from candlestack's docs/mcp-tools.json.
// /docs/mcp/tools/ and the web only list of /docs/mcp/ are built from the copy in src/data/.
//
//   npm run mcp-tools             copies candlestack's current file over the site's copy
//   npm run mcp-tools -- --check  fails when the site's copy differs from candlestack's (CI)

import { readFile, writeFile } from 'node:fs/promises';

const SOURCE = 'https://raw.githubusercontent.com/candlestack-tech/candlestack/main/docs/mcp-tools.json';
const COPY = new URL('../src/data/mcp-tools.json', import.meta.url);

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`${SOURCE}: ${response.status} ${response.statusText}`);
const latest = await response.text();
JSON.parse(latest);

if (process.argv.includes('--check')) {
  const copy = await readFile(COPY, 'utf8');
  if (copy !== latest) {
    process.stderr.write(
      "src/data/mcp-tools.json is older than candlestack's docs/mcp-tools.json.\n" +
        'Run `npm run mcp-tools`, check /docs/mcp/tools/ with `npm run dev` and commit the file.\n',
    );
    process.exit(1);
  }
  process.stdout.write("src/data/mcp-tools.json matches candlestack's docs/mcp-tools.json.\n");
} else {
  await writeFile(COPY, latest);
  process.stdout.write(`Copied ${SOURCE} to src/data/mcp-tools.json.\n`);
}
