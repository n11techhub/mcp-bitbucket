import {z} from "zod";
import {AddBranchInputSchema} from "../../application/dtos/AddBranchInputSchema";

export interface AddBranchInput extends z.infer<typeof AddBranchInputSchema> {}

