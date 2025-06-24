import { z } from 'zod';
import { CommentOptionSchema } from '../schemas/CommentOptionSchema.js';

export type CommentOption = z.infer<typeof CommentOptionSchema>;
