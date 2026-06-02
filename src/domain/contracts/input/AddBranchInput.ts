import {z} from "zod/v3";
import {AddBranchInputSchema} from "../schemas/AddBranchInputSchema.js";

export interface AddBranchInput extends z.infer<typeof AddBranchInputSchema> {}
