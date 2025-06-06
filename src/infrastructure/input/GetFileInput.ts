import {z} from "zod";
import {GetFileInputSchema} from "../../application/dtos/GetFileInputSchema";

export interface GetFileInput extends z.infer<typeof GetFileInputSchema> {}