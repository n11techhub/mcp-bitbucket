import {RepositoryInput} from "./RepositoryInput";

export interface PullRequestParams extends RepositoryInput {
    prId: number;
}