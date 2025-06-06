import {z} from "zod";
import {AddPrCommentInputSchema} from "../../application/dtos/AddPrCommentInputSchema";

export interface AddPrCommentInput extends z.infer<typeof AddPrCommentInputSchema> {}

