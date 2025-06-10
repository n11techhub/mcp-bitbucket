import { PullRequestInput } from "../../infrastructure/input/PullRequestInput";
import { PullRequestParams } from "../../infrastructure/input/PullRequestParams";
import { MergeOption } from "../../infrastructure/option/MergeOption";
import { CommentOption } from "../../infrastructure/option/CommentOption";
import { AddPrCommentInput } from "../../infrastructure/input/AddPrCommentInput";

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
