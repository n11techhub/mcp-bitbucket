import { z } from "zod/v3";
import { DeclinePullRequestInputSchema } from "../schemas/DeclinePullRequestInputSchema.js";

export interface DeclinePullRequestInput extends z.infer<typeof DeclinePullRequestInputSchema> {}
