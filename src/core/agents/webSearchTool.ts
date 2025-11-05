import { Tool } from 'langchain';
import { search, SearchOptions } from 'duck-duck-scrape';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class WebSearchTool extends Tool {
  name = 'web_search';
  description = 'A web search engine for current events. Input is a query.';
  constructor(
    private contentOptions: {
      fetchArticleContent?: boolean;
      maxArticleLength?: number;
    } = { fetchArticleContent: false, maxArticleLength: 1000 },
    private options?: SearchOptions,
  ) {
    super();
  }
  async _call(input: string): Promise<string> {
    console.log('WebSearchTool called with input:', input);
    try {
      const { results } = await search(input, this.options);
      if (results.length === 0) {
        return 'No results found.';
      }
      const topResult = results[0];
      let articleText = '';
      if (this.contentOptions.fetchArticleContent) {
        const res = await axios.get(topResult.url);
        const $ = cheerio.load(res.data);
        articleText = $('body')
          .text()
          .slice(0, this.contentOptions.maxArticleLength); // Get first 1000 chars
      }
      const result = {
        title: topResult.title,
        link: topResult.url,
        snippet: topResult.description,
        article: articleText,
      };

      console.log('WebSearchTool result:', JSON.stringify(result));

      return JSON.stringify(result);
    } catch (error) {
      console.error('WebSearchTool error:', error);
      return 'An error occurred while performing the web search.';
    }
  }
}
