import { z } from 'zod';
import { SearchContentInputSchema } from '../../application/dtos/SearchContentInputSchema.js';

export type SearchContentInput = z.infer<typeof SearchContentInputSchema>;

