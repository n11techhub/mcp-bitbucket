import { z } from "zod/v3";
import { MergePullRequestInputSchema } from "../schemas/MergePullRequestInputSchema.js";

export interface MergePullRequestInput extends z.infer<typeof MergePullRequestInputSchema> {}
