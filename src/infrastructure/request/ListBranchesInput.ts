import {z} from "zod";
import {ListBranchesInputSchema} from "../../application/schema/ListBranchesInputSchema";

export interface ListBranchesInput extends z.infer<typeof ListBranchesInputSchema> {}

