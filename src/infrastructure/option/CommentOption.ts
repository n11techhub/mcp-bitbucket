import { z } from 'zod';
import { CommentOptionSchema } from '../../application/dtos/CommentOptionSchema';

// Type is inferred from CommentOptionSchema in dtos
export type CommentOption = z.infer<typeof CommentOptionSchema>;