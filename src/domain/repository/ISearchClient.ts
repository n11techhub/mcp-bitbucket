import { SearchContentInput } from '../contracts/input/SearchContentInput.js';

export interface ISearchClient {
    searchBitbucketContent(input: SearchContentInput): Promise<any>;
}
