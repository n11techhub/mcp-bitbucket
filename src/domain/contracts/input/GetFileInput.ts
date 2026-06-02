import {z} from "zod/v3";
import { GetFileInputSchema } from '../schemas/GetFileInputSchema.js';

export interface GetFileInput extends z.infer<typeof GetFileInputSchema> {}
