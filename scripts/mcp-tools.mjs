// The tool reference of the MCP server, vendored from candlestack's docs/mcp-tools.json.
// /docs/mcp/tools/ and the web only list of /docs/mcp/ are built from the copy in src/data/.
//
//   npm run mcp-tools             copies candlestack's file over the site's copy
//   npm run mcp-tools -- --check  fails when the site's copy differs from candlestack's (CI)
//
// The docs describe what app.candlestack.tech runs, and prod runs candlestack's releases. So the
// file comes from the newest release tag (vX.Y.Z). Until a release has the file, it comes from
// main, and the MCP pages say "Available from the next release".

import { readFile, writeFile } from 'node:fs/promises';

const REPO = 'candlestack-tech/candlestack';
const PATH = 'docs/mcp-tools.json';
const COPY = new URL('../src/data/mcp-tools.json', import.meta.url);

async function get(url, headers = {}) {
  const response = await fetch(url, { headers });
  if (!response.ok && response.status !== 404) throw new Error(`${url}: ${response.status} ${response.statusText}`);
  return response;
}

// The newest vX.Y.Z tag, by version, not by date
async function newestRelease() {
  const auth = process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
  const response = await get(`https://api.github.com/repos/${REPO}/tags?per_page=100`, auth);
  const versions = (await response.json())
    .map((tag) => /^v(\d+)\.(\d+)\.(\d+)$/.exec(tag.name))
    .filter(Boolean)
    .map((m) => ({ name: m[0], parts: m.slice(1).map(Number) }));
  versions.sort((a, b) => b.parts[0] - a.parts[0] || b.parts[1] - a.parts[1] || b.parts[2] - a.parts[2]);
  return versions[0]?.name;
}

async function latest() {
  const tag = await newestRelease();
  for (const ref of [tag, 'main'].filter(Boolean)) {
    const url = `https://raw.githubusercontent.com/${REPO}/${ref}/${PATH}`;
    const response = await get(url);
    if (response.ok) return { ref, url, body: await response.text() };
  }
  throw new Error(`${REPO} has no ${PATH} on main`);
}

const { ref, url, body } = await latest();
JSON.parse(body);
const from = ref === 'main' ? 'main (no release has it yet)' : `release ${ref}`;

if (process.argv.includes('--check')) {
  const copy = await readFile(COPY, 'utf8');
  if (copy !== body) {
    process.stderr.write(
      `src/data/mcp-tools.json differs from candlestack's ${PATH} on ${from}.\n` +
        'Run `npm run mcp-tools`, check /docs/mcp/tools/ with `npm run dev` and commit the file.\n',
    );
    process.exit(1);
  }
  process.stdout.write(`src/data/mcp-tools.json matches candlestack's ${PATH} on ${from}.\n`);
} else {
  await writeFile(COPY, body);
  process.stdout.write(`Copied ${url} to src/data/mcp-tools.json (${from}).\n`);
}
