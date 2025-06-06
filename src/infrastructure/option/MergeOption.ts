import { z } from 'zod';
import { MergeOptionSchema } from '../../application/dtos/MergeOptionSchema';

// Type is inferred from MergeOptionSchema in dtos
export type MergeOption = z.infer<typeof MergeOptionSchema>;