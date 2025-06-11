import { ListWorkspacesInput } from '../../infrastructure/input/ListWorkspacesInput.js';

export interface IWorkspaceClient {
    listBitbucketWorkspaces(input?: ListWorkspacesInput): Promise<any>;
}
