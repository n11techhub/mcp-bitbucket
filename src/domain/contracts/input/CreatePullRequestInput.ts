import { z } from "zod";
import { CreatePullRequestInputSchema } from "../schemas/CreatePullRequestInputSchema.js";

export interface CreatePullRequestInput extends z.infer<typeof CreatePullRequestInputSchema> {}
