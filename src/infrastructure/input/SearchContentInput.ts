import { z } from 'zod';
import { SearchContentInputSchema } from '../../application/dtos/SearchContentInputSchema.js';

// Type is inferred from SearchContentInputSchema in dtos
export type SearchContentInput = z.infer<typeof SearchContentInputSchema>;

