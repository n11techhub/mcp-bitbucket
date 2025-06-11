import {z} from "zod";
import { ListBranchesInputSchema } from '../../application/dtos/ListBranchesInputSchema.js';

export interface ListBranchesInput extends z.infer<typeof ListBranchesInputSchema> {}
