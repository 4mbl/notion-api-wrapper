import { AuthenticationError, E } from './internal/errors.js';

export function getApiKey(options?: { notionToken?: string }) {
  const OLD_ENV = process.env.NOTION_API_KEY;

  if (OLD_ENV) {
    process.emitWarning(
      'Use of NOTION_API_KEY environment variable is deprecated and will not be supported in a future version. Please rename it to NOTION_TOKEN.',
      { type: 'DeprecationWarning' },
    );
  }

  const apiKey = options?.notionToken ?? process.env.NOTION_TOKEN ?? OLD_ENV;

  if (!apiKey) throw new AuthenticationError(E.NO_API_TOKEN);
  return apiKey;
}
