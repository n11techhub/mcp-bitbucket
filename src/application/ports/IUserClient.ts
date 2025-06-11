import { GetUserInputType } from '../dtos/GetUserInputSchema.js';

export interface IUserClient {
  getBitbucketUserDetails(input: GetUserInputType): Promise<any>;
}
