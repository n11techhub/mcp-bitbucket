import { ListRepositoriesInput } from "../../infrastructure/input/ListRepositoriesInput.js";
import { ListBranchesInput } from "../../infrastructure/input/ListBranchesInput.js";
import { AddBranchInput } from "../../infrastructure/input/AddBranchInput.js";
import { GetFileInput } from "../../infrastructure/input/GetFileInput.js";
import { GetRepoInput } from "../../infrastructure/input/GetRepoInput.js";

export interface IRepositoryClient {
    listBitbucketRepositories(input?: ListRepositoriesInput): Promise<any>;
    listBitbucketRepositoryBranches(input: ListBranchesInput): Promise<any>;
    createBitbucketBranch(input: AddBranchInput): Promise<any>;
    getBitbucketFileContent(input: GetFileInput): Promise<any>;
    getBitbucketRepositoryDetails(input: GetRepoInput): Promise<any>;
}
