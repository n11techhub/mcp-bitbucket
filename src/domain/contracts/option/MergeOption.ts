import { z } from 'zod/v3';
import { MergeOptionSchema } from '../schemas/MergeOptionSchema.js';

export type MergeOption = z.infer<typeof MergeOptionSchema>;
