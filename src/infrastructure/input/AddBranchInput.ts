import {z} from "zod";
import {AddBranchInputSchema} from "../../application/dtos/AddBranchInputSchema.js";

export interface AddBranchInput extends z.infer<typeof AddBranchInputSchema> {}
