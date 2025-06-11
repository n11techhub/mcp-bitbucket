import { z } from 'zod';
import { CommentOptionSchema } from '../../application/dtos/CommentOptionSchema.js';

export type CommentOption = z.infer<typeof CommentOptionSchema>;