import {z} from "zod/v3";
import { ListBranchesInputSchema } from '../schemas/ListBranchesInputSchema.js';

export interface ListBranchesInput extends z.infer<typeof ListBranchesInputSchema> {}
