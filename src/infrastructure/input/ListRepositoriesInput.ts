import { z } from 'zod';
import { ListRepositoriesInputSchema } from '../../application/dtos/ListRepositoriesInputSchema.js';

// Type is inferred from ListRepositoriesInputSchema in dtos
export type ListRepositoriesInput = z.infer<typeof ListRepositoriesInputSchema>;