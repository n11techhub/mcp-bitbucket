import { z } from "zod";
import { MergePullRequestInputSchema } from "../schemas/MergePullRequestInputSchema.js";

export interface MergePullRequestInput extends z.infer<typeof MergePullRequestInputSchema> {}
