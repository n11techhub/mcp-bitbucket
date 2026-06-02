import { z } from "zod/v3";
import { GetPullRequestInputSchema } from "../schemas/GetPullRequestInputSchema.js";

export interface GetPullRequestInput extends z.infer<typeof GetPullRequestInputSchema> {}
