import { z } from "zod/v3";
import { GetUserInputSchema } from "../schemas/GetUserInputSchema.js";

export interface GetUserInput extends z.infer<typeof GetUserInputSchema> {}
