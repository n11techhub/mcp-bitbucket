import {z} from "zod";
import {AddPrCommentInputSchema} from "../schemas/AddPrCommentInputSchema.js";

export interface AddPrCommentInput extends z.infer<typeof AddPrCommentInputSchema> {}
