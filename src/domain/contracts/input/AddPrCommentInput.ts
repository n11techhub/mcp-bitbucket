import {z} from "zod/v3";
import {AddPrCommentInputSchema} from "../schemas/AddPrCommentInputSchema.js";

export interface AddPrCommentInput extends z.infer<typeof AddPrCommentInputSchema> {}
