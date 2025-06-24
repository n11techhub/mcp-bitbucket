import { z } from 'zod';
import { MergeOptionSchema } from '../schemas/MergeOptionSchema.js';

export type MergeOption = z.infer<typeof MergeOptionSchema>;
