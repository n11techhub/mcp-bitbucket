import { z } from "zod/v3";
import { GetDiffInputSchema } from "../schemas/GetDiffInputSchema.js";

export interface GetDiffInput extends z.infer<typeof GetDiffInputSchema> {}
