import { z } from 'zod';
import { MergeOptionSchema } from '../../application/dtos/MergeOptionSchema';

export type MergeOption = z.infer<typeof MergeOptionSchema>;