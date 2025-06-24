import { z } from "zod";
import { GetDiffInputSchema } from "../schemas/GetDiffInputSchema.js";

export interface GetDiffInput extends z.infer<typeof GetDiffInputSchema> {}
