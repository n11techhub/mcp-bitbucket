import { z } from "zod";
import { GetUserInputSchema } from "../schemas/GetUserInputSchema.js";

export interface GetUserInput extends z.infer<typeof GetUserInputSchema> {}
