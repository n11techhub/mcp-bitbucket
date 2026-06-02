import { z } from 'zod/v3';
import { SearchContentInputSchema } from '../schemas/SearchContentInputSchema.js';

export type SearchContentInput = z.infer<typeof SearchContentInputSchema>;
