import { ListRepositoriesInput } from "../../infrastructure/input/ListRepositoriesInput";
import { ListBranchesInput } from "../../infrastructure/input/ListBranchesInput";
import { AddBranchInput } from "../../infrastructure/input/AddBranchInput";
import { GetFileInput } from "../../infrastructure/input/GetFileInput";
import { GetRepoInput } from "../../infrastructure/input/GetRepoInput";

export interface IRepositoryClient {
    listBitbucketRepositories(input?: ListRepositoriesInput): Promise<any>;
    listBitbucketRepositoryBranches(input: ListBranchesInput): Promise<any>;
    createBitbucketBranch(input: AddBranchInput): Promise<any>;
    getBitbucketFileContent(input: GetFileInput): Promise<any>;
    getBitbucketRepositoryDetails(input: GetRepoInput): Promise<any>;
}
