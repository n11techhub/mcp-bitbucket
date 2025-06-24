import { z } from 'zod';
import { SearchContentInputSchema } from '../schemas/SearchContentInputSchema.js';

export type SearchContentInput = z.infer<typeof SearchContentInputSchema>;
