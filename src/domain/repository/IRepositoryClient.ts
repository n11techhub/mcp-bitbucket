import { ListRepositoriesInput } from '../contracts/input/ListRepositoriesInput.js';
import { ListBranchesInput } from '../contracts/input/ListBranchesInput.js';
import { AddBranchInput } from '../contracts/input/AddBranchInput.js';
import { GetFileInput } from '../contracts/input/GetFileInput.js';
import { GetRepoInput } from '../contracts/input/GetRepoInput.js';

export interface IRepositoryClient {
    listBitbucketRepositories(input?: ListRepositoriesInput): Promise<any>;
    listBitbucketRepositoryBranches(input: ListBranchesInput): Promise<any>;
    createBitbucketBranch(input: AddBranchInput): Promise<any>;
    getBitbucketFileContent(input: GetFileInput): Promise<any>;
    getBitbucketRepositoryDetails(input: GetRepoInput): Promise<any>;
}
