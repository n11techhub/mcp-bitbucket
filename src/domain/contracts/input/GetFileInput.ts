import {z} from "zod";
import { GetFileInputSchema } from '../schemas/GetFileInputSchema.js';

export interface GetFileInput extends z.infer<typeof GetFileInputSchema> {}
