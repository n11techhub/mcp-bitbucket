import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
config({ path: resolve(projectRoot, '.env'), override: false, quiet: true });

// Template defaults are useful for local/dev, but should not affect production.
if (process.env.NODE_ENV !== 'production') {
    config({ path: resolve(projectRoot, 'config.template.env'), override: false, quiet: true });
}
