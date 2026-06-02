import { z } from 'zod/v3';

export const GetUserInputSchema = z.object({
  username: z.string().describe('The username of the Bitbucket user.'),
});

export type GetUserInputType = z.infer<typeof GetUserInputSchema>;
