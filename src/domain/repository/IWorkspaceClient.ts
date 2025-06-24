import { ListWorkspacesInput } from '../contracts/input/ListWorkspacesInput.js';

export interface IWorkspaceClient {
    listBitbucketWorkspaces(input?: ListWorkspacesInput): Promise<any>;
}
