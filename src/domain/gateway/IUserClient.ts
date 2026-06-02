import { GetUserInputType } from '../contracts/schemas/index.js';

export interface IUserClient {
  getBitbucketUserDetails(input: GetUserInputType): Promise<any>;
}
