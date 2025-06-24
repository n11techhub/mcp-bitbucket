import { z } from 'zod';
import { ListRepositoriesInputSchema } from '../schemas/ListRepositoriesInputSchema.js';

export type ListRepositoriesInput = z.infer<typeof ListRepositoriesInputSchema>;
