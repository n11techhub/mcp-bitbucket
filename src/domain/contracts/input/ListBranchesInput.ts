import {z} from "zod";
import { ListBranchesInputSchema } from '../schemas/ListBranchesInputSchema.js';

export interface ListBranchesInput extends z.infer<typeof ListBranchesInputSchema> {}
