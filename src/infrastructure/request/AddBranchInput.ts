import {z} from "zod";
import {AddBranchInputSchema} from "../../application/schema/AddBranchInputSchema";

export interface AddBranchInput extends z.infer<typeof AddBranchInputSchema> {}

