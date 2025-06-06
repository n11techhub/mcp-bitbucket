import {z} from "zod";
import {ListBranchesInputSchema} from "../../application/dtos/ListBranchesInputSchema";

export interface ListBranchesInput extends z.infer<typeof ListBranchesInputSchema> {}

