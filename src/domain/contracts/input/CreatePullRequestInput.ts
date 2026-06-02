import { z } from "zod/v3";
import { CreatePullRequestInputSchema } from "../schemas/CreatePullRequestInputSchema.js";

export interface CreatePullRequestInput extends z.infer<typeof CreatePullRequestInputSchema> {}
