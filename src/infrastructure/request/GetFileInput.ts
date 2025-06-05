import {z} from "zod";
import {GetFileInputSchema} from "../../application/schema/GetFileInputSchema";

export interface GetFileInput extends z.infer<typeof GetFileInputSchema> {}