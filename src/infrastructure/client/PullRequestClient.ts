import axios from "axios";
import { injectable, inject } from 'inversify';
import { PullRequestInput } from '../../domain/contracts/input/index.js';
import { PullRequestParams } from '../../domain/contracts/input/index.js';
import { MergeOption } from '../../domain/contracts/option/MergeOption.js';
import { CommentOption } from '../../domain/contracts/option/CommentOption.js';
import { AddPrCommentInput } from '../../domain/contracts/input/index.js';
import { IPullRequestClient } from '../../domain/gateway/IPullRequestClient.js';
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import winston from 'winston';
import {Types} from "../../application/Types.js";
import {Configuration} from "../configuration/Configuration.js";
import {BaseClient} from "./BaseClient.js";

@injectable()
export class PullRequestClient extends BaseClient implements IPullRequestClient {
    constructor(
        @inject(Types.Configuration) config: Configuration,
        @inject(Types.Logger) logger: winston.Logger
    ) {
        super(config, logger);
    }

    public async createBitbucketPullRequest(input: PullRequestInput): Promise<any> {
        const project = encodeURIComponent(this.requireProjectKey(input.project));
        const repository = encodeURIComponent(input.repository);
        const response = await this.api.post(
            `/projects/${project}/repos/${repository}/pull-requests`,
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
        const encodedProject = encodeURIComponent(this.requireProjectKey(project));
        const encodedRepository = encodeURIComponent(repository);
        const response = await this.api.get(
            `/projects/${encodedProject}/repos/${encodedRepository}/pull-requests/${prId}`
        );

        return {
            content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
        };
    }

    public async approveBitbucketPullRequest(params: PullRequestParams, version?: number): Promise<any> {
        const { project, repository, prId } = params;
        const encodedProject = encodeURIComponent(this.requireProjectKey(project));
        const encodedRepository = encodeURIComponent(repository);
        const response = await this.api.post(
            `/projects/${encodedProject}/repos/${encodedRepository}/pull-requests/${prId}/approve`,
            version === undefined ? {} : { version }
        );

        return {
            content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
        };
    }

    public async mergeBitbucketPullRequest(params: PullRequestParams, options: MergeOption = {}): Promise<any> {
        const { project, repository, prId } = params;
        const encodedProject = encodeURIComponent(this.requireProjectKey(project));
        const encodedRepository = encodeURIComponent(repository);
        const { message, strategy = 'merge-commit' } = options;

        const response = await this.api.post(
            `/projects/${encodedProject}/repos/${encodedRepository}/pull-requests/${prId}/merge`,
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
        const encodedProject = encodeURIComponent(this.requireProjectKey(project));
        const encodedRepository = encodeURIComponent(repository);
        const response = await this.api.post(
            `/projects/${encodedProject}/repos/${encodedRepository}/pull-requests/${prId}/decline`,
            { version: -1, message }
        );

        return {
            content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
        };
    }

    public async addBitbucketGeneralPullRequestComment(params: PullRequestParams, options: CommentOption): Promise<any> {
        const { project, repository, prId } = params;
        const encodedProject = encodeURIComponent(this.requireProjectKey(project));
        const encodedRepository = encodeURIComponent(repository);
        const { text, parentId } = options;

        const response = await this.api.post(
            `/projects/${encodedProject}/repos/${encodedRepository}/pull-requests/${prId}/comments`,
            { text, parent: parentId ? { id: parentId } : undefined }
        );

        return {
            content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
        };
    }

    public async getBitbucketPullRequestDiff(params: PullRequestParams, contextLines: number = 10): Promise<any> {
        const { project, repository, prId } = params;
        const encodedProject = encodeURIComponent(this.requireProjectKey(project));
        const encodedRepository = encodeURIComponent(repository);

        const response = await this.api.get(
            `/projects/${encodedProject}/repos/${encodedRepository}/pull-requests/${prId}/diff`,
            { params: { withComments: false, contextLines } }
        );

        return {
            content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
        };
    }

    public async getBitbucketPullRequestReviews(params: PullRequestParams): Promise<any> {
        const { project, repository, prId } = params;
        const encodedProject = encodeURIComponent(this.requireProjectKey(project));
        const encodedRepository = encodeURIComponent(repository);

        const response = await this.api.get(
            `/projects/${encodedProject}/repos/${encodedRepository}/pull-requests/${prId}/activities`,
            { params: { activity: 'reviews' } }
        );

        return {
            content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
        };
    }

    public async addBitbucketPullRequestFileLineComment(input: AddPrCommentInput): Promise<any> {
        const { workspaceSlug, repoSlug, prId, content, inline, parentId } = input;
        const projectKey = this.requireProjectKey(workspaceSlug);

        const payload: any = {
            text: content,
        };

        if (parentId) {
            payload.parent = { id: parentId };
        }

        if (inline) {
            payload.anchor = {
                line: inline.line,
                lineType: inline.lineType ?? 'CONTEXT',
                fileType: inline.fileType ?? 'TO',
                path: inline.path,
            };
        }

        try {
            this.logger.info(`Adding PR comment for projectKey: ${projectKey}, repoSlug: ${repoSlug}, prId: ${prId}, hasInline: ${Boolean(inline)}, hasParent: ${Boolean(parentId)}`);
            const response = await this.api.post(
                `/projects/${encodeURIComponent(projectKey)}/repos/${encodeURIComponent(repoSlug)}/pull-requests/${prId}/comments`,
                payload
            );
            return {
                content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
            };
        } catch (error: any) {
            this.logger.error(`Error adding PR comment (projectKey: ${projectKey}, repoSlug: ${repoSlug}, prId: ${prId}):`, error.response?.data ?? error.message);
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

    private requireProjectKey(projectKey?: string): string {
        if (!projectKey) {
            throw new McpError(ErrorCode.InvalidParams, 'Project key is required.');
        }
        return projectKey;
    }
}
