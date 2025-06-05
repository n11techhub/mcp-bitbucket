import {z} from "zod";
import {GetRepoInputSchema} from "../../application/schema/GetRepoInputSchema";

export interface GetRepoInput extends z.infer<typeof GetRepoInputSchema> {}

