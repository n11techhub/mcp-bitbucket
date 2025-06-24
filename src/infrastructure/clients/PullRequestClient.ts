import axios, { AxiosInstance } from "axios";
import { injectable, inject } from 'inversify';
import { BitbucketConfig } from "../config/BitbucketConfig.js";
import { PullRequestInput } from '../../domain/contracts/input/PullRequestInput.js';
import { PullRequestParams } from '../../domain/contracts/input/PullRequestParams.js';
import { MergeOption } from '../../domain/contracts/option/MergeOption.js';
import { CommentOption } from '../../domain/contracts/option/CommentOption.js';
import { AddPrCommentInput } from '../../domain/contracts/input/AddPrCommentInput.js';
import { IPullRequestClient } from '../../domain/repository/IPullRequestClient.js';
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import winston from 'winston';
import { TYPES } from '../types.js';

@injectable()
export class PullRequestClient implements IPullRequestClient {
    private readonly api: AxiosInstance;
    private readonly logger: winston.Logger;

    constructor(
        @inject(TYPES.BitbucketConfig) config: BitbucketConfig, 
        @inject(TYPES.Logger) logger: winston.Logger
    ) {
        this.logger = logger;
        this.api = axios.create({
            baseURL: `${config.baseUrl}/rest/api/1.0`,
            headers: config.token
                ? { Authorization: `Bearer ${config.token}` }
                : {},
            auth: config.username && config.password
                ? { username: config.username, password: config.password }
                : undefined,
        });
    }

    public async createBitbucketPullRequest(input: PullRequestInput): Promise<any> {
        const response = await this.api.post(
            `/projects/${input.project}/repos/${input.repository}/pull-requests`,
            {
                title: input.title,
                description: input.description,
                fromRef: {
                    id: `refs/heads/${input.sourceBranch}`,
                    repository: {
                        slug: input.repository,
                        project: { key: input.project }
                    }
                },
                toRef: {
                    id: `refs/heads/${input.targetBranch}`,
                    repository: {
                        slug: input.repository,
                        project: { key: input.project }
                    }
                },
                reviewers: input.reviewers?.map((username: string) => ({ user: { name: username } }))
            }
        );

        return {
            content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
        };
    }

    public async getBitbucketPullRequestDetails(params: PullRequestParams): Promise<any> {
        const { project, repository, prId } = params;
        const response = await this.api.get(
            `/projects/${project}/repos/${repository}/pull-requests/${prId}`
        );

        return {
            content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
        };
    }

    public async mergeBitbucketPullRequest(params: PullRequestParams, options: MergeOption = {}): Promise<any> {
        const { project, repository, prId } = params;
        const { message, strategy = 'merge-commit' } = options;

        const response = await this.api.post(
            `/projects/${project}/repos/${repository}/pull-requests/${prId}/merge`,
            {
                version: -1,
                message,
                strategy
            }
        );

        return {
            content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
        };
    }

    public async declineBitbucketPullRequest(params: PullRequestParams, message?: string): Promise<any> {
        const { project, repository, prId } = params;
        const response = await this.api.post(
            `/projects/${project}/repos/${repository}/pull-requests/${prId}/decline`,
            { version: -1, message }
        );

        return {
            content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
        };
    }

    public async addBitbucketGeneralPullRequestComment(params: PullRequestParams, options: CommentOption): Promise<any> {
        const { project, repository, prId } = params;
        const { text, parentId } = options;

        const response = await this.api.post(
            `/projects/${project}/repos/${repository}/pull-requests/${prId}/comments`,
            { text, parent: parentId ? { id: parentId } : undefined }
        );

        return {
            content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
        };
    }

    public async getBitbucketPullRequestDiff(params: PullRequestParams, contextLines: number = 10): Promise<any> {
        const { project, repository, prId } = params;

        const response = await this.api.get(
            `/projects/${project}/repos/${repository}/pull-requests/${prId}/diff`,
            { params: { withComments: false, contextLines } }
        );

        return {
            content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
        };
    }

    public async getBitbucketPullRequestReviews(params: PullRequestParams): Promise<any> {
        const { project, repository, prId } = params;

        const response = await this.api.get(
            `/projects/${project}/repos/${repository}/pull-requests/${prId}/activities`,
            { params: { activity: 'reviews' } }
        );

        return {
            content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
        };
    }

    public async addBitbucketPullRequestFileLineComment(input: AddPrCommentInput): Promise<any> {
        const { workspaceSlug, repoSlug, prId, content, inline, parentId } = input;
        const projectKey = workspaceSlug;

        const payload: any = {
            text: content,
        };

        if (parentId) {
            payload.parent = { id: parentId };
        }

        if (inline) {
            payload.anchor = {
                line: inline.line,
                lineType: inline.lineType || 'CONTEXT',
                fileType: inline.fileType || 'TO',
                path: inline.path,
            };
        }

        try {
            this.logger.info(`Adding PR comment with payload: ${JSON.stringify(payload)}`);
            const response = await this.api.post(
                `/projects/${projectKey}/repos/${repoSlug}/pull-requests/${prId}/comments`,
                payload
            );
            return {
                content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
            };
        } catch (error: any) {
            this.logger.error(`Error adding PR comment (projectKey: ${projectKey}, repoSlug: ${repoSlug}, prId: ${prId}):`, error.response?.data || error.message);
            if (axios.isAxiosError(error) && error.response) {
                const errorMessage = error.response.data.errors?.[0]?.message ?? error.response.data.message ?? error.message;
                throw new McpError(
                    ErrorCode.InternalError,
                    `Bitbucket API error: ${errorMessage}`
                );
            }
            throw new McpError(ErrorCode.InternalError, `Failed to add PR comment: ${error.message}`);
        }
    }
}
