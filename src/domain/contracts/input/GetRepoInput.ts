import {z} from "zod";
import { GetRepoInputSchema } from '../schemas/GetRepoInputSchema.js';

export interface GetRepoInput extends z.infer<typeof GetRepoInputSchema> {}
