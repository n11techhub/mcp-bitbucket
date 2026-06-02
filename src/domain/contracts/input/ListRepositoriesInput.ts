import { z } from 'zod/v3';
import { ListRepositoriesInputSchema } from '../schemas/ListRepositoriesInputSchema.js';

export type ListRepositoriesInput = z.infer<typeof ListRepositoriesInputSchema>;
