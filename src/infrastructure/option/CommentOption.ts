import { z } from 'zod';
import { CommentOptionSchema } from '../../application/dtos/CommentOptionSchema';

export type CommentOption = z.infer<typeof CommentOptionSchema>;