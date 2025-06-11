import { PullRequestInput } from "../../infrastructure/input/PullRequestInput.js";
import { PullRequestParams } from "../../infrastructure/input/PullRequestParams.js";
import { MergeOption } from "../../infrastructure/option/MergeOption.js";
import { CommentOption } from "../../infrastructure/option/CommentOption.js";
import { AddPrCommentInput } from "../../infrastructure/input/AddPrCommentInput.js";

export interface IPullRequestClient {
    createBitbucketPullRequest(input: PullRequestInput): Promise<any>;
    getBitbucketPullRequestDetails(params: PullRequestParams): Promise<any>;
    mergeBitbucketPullRequest(params: PullRequestParams, options?: MergeOption): Promise<any>;
    declineBitbucketPullRequest(params: PullRequestParams, message?: string): Promise<any>;
    addBitbucketGeneralPullRequestComment(params: PullRequestParams, options: CommentOption): Promise<any>;
    getBitbucketPullRequestDiff(params: PullRequestParams, contextLines?: number): Promise<any>;
    getBitbucketPullRequestReviews(params: PullRequestParams): Promise<any>;
    addBitbucketPullRequestFileLineComment(input: AddPrCommentInput): Promise<any>;
}
