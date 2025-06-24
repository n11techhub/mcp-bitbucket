import { z } from "zod";
import { GetPullRequestInputSchema } from "../schemas/GetPullRequestInputSchema.js";

export interface GetPullRequestInput extends z.infer<typeof GetPullRequestInputSchema> {}
