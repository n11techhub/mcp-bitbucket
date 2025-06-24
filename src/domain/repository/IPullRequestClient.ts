import { PullRequestInput } from '../contracts/input/PullRequestInput.js';
import { PullRequestParams } from '../contracts/input/PullRequestParams.js';
import { AddPrCommentInput } from '../contracts/input/AddPrCommentInput.js';
import { MergeOption } from '../contracts/option/MergeOption.js';
import { CommentOption } from '../contracts/option/CommentOption.js';

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
