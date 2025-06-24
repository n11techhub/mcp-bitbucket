import {z} from "zod";
import {AddBranchInputSchema} from "../schemas/AddBranchInputSchema.js";

export interface AddBranchInput extends z.infer<typeof AddBranchInputSchema> {}
