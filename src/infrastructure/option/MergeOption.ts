import { z } from 'zod';
import { MergeOptionSchema } from '../../application/dtos/MergeOptionSchema.js';

export type MergeOption = z.infer<typeof MergeOptionSchema>;