import {z} from "zod";
import { GetRepoInputSchema } from '../../application/dtos/GetRepoInputSchema.js';

export interface GetRepoInput extends z.infer<typeof GetRepoInputSchema> {}
