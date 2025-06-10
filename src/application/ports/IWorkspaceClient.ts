import { ListWorkspacesInput } from "../../infrastructure/input/ListWorkspacesInput";

export interface IWorkspaceClient {
    listBitbucketWorkspaces(input?: ListWorkspacesInput): Promise<any>;
}
