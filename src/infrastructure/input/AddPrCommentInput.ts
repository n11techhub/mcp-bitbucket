import {z} from "zod";
import {AddPrCommentInputSchema} from "../../application/dtos/AddPrCommentInputSchema.js";

export interface AddPrCommentInput extends z.infer<typeof AddPrCommentInputSchema> {}
