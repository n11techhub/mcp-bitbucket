import {z} from "zod/v3";
import { GetRepoInputSchema } from '../schemas/GetRepoInputSchema.js';

export interface GetRepoInput extends z.infer<typeof GetRepoInputSchema> {}
