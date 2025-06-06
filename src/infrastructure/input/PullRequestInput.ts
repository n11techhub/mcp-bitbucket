import {RepositoryInput} from "./RepositoryInput";

export interface PullRequestInput extends RepositoryInput {
    title: string;
    description: string;
    sourceBranch: string;
    targetBranch: string;
    reviewers?: string[];
}