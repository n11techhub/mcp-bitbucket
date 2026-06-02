import { z } from 'zod/v3';
import { CommentOptionSchema } from '../schemas/CommentOptionSchema.js';

export type CommentOption = z.infer<typeof CommentOptionSchema>;
