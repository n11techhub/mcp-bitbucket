import { z } from "zod";
import { DeclinePullRequestInputSchema } from "../schemas/DeclinePullRequestInputSchema.js";

export interface DeclinePullRequestInput extends z.infer<typeof DeclinePullRequestInputSchema> {}
