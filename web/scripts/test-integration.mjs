import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

await mkdir('.cache', { recursive: true });
await writeFile('.cache/app-entry.jsx', "export {default} from '../src/App.jsx'; export {supabase} from '../src/lib/supabaseClient.js';\n");
await build({ entryPoints: ['.cache/app-entry.jsx'], outfile: '.cache/app-test.mjs', bundle: true,
  platform: 'node', format: 'esm', packages: 'external', jsx: 'automatic',
  define: { 'import.meta.env': JSON.stringify({ VITE_SUPABASE_URL: 'https://raje3-test.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_local_test_fixture' }) } });
const result = spawnSync(process.execPath, ['--import', './tests/setup-dom.mjs', '--test', './tests/app.integration.test.mjs'], { stdio: 'inherit' });
process.exitCode = result.status ?? 1;
