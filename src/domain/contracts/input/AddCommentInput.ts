import { z } from "zod";
import { AddCommentInputSchema } from "../schemas/AddCommentInputSchema.js";

export interface AddCommentInput extends z.infer<typeof AddCommentInputSchema> {}
