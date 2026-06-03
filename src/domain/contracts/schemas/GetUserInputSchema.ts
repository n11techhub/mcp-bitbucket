import { z } from 'zod/v3';

const USERNAME_PATTERN = /^[A-Za-z0-9._@-]+$/;

export const GetUserInputSchema = z.object({
  username: z.string()
      .min(1)
      .max(255)
      .regex(USERNAME_PATTERN, 'Invalid username format')
      .describe('The username of the Bitbucket user.'),
});

export type GetUserInputType = z.infer<typeof GetUserInputSchema>;
