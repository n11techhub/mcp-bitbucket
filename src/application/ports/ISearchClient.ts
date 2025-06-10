import { SearchContentInput } from "../../infrastructure/input/SearchContentInput";

export interface ISearchClient {
    searchBitbucketContent(input: SearchContentInput): Promise<any>;
}
