import {z} from "zod";
import {AddPrCommentInputSchema} from "../../application/schema/AddPrCommentInputSchema";

export interface AddPrCommentInput extends z.infer<typeof AddPrCommentInputSchema> {}

