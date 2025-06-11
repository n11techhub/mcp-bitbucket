import { SearchContentInput } from "../../infrastructure/input/SearchContentInput.js";

export interface ISearchClient {
    searchBitbucketContent(input: SearchContentInput): Promise<any>;
}
