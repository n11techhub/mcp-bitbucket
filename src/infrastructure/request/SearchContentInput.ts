export interface SearchContentInput {
    workspaceSlug: string;
    query: string;
    scope?: string;
    language?: string;
    extension?: string;
}
