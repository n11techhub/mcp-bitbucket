import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname);
config({ path: resolve(projectRoot, '.env'), override: false });
config({ path: resolve(projectRoot, 'config.template.env'), override: false });
