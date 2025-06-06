import {z} from "zod";
import {GetRepoInputSchema} from "../../application/dtos/GetRepoInputSchema";

export interface GetRepoInput extends z.infer<typeof GetRepoInputSchema> {}

