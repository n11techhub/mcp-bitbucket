import { z } from 'zod';
import { ListRepositoriesInputSchema } from '../../application/dtos/ListRepositoriesInputSchema.js';

export type ListRepositoriesInput = z.infer<typeof ListRepositoriesInputSchema>;