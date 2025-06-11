import {z} from "zod";
import { GetFileInputSchema } from '../../application/dtos/GetFileInputSchema.js';

export interface GetFileInput extends z.infer<typeof GetFileInputSchema> {}