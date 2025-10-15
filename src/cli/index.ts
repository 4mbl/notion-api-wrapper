import { retrieveDatabase } from '../api/databases/retrieve.js';

export type Command = {
  run: (arg: string) => void;
  description: string;
};

export async function fetchDataSources(
  input: string,
  options?: { noPrint?: boolean },
) {
  const dbId =
    input.length === 32
      ? input
      : extractDatabaseId(input, {
          noPrint: true,
        });

  if (!dbId) {
    if (!options?.noPrint) console.error('Invalid database ID');
    return;
  }

  return retrieveDatabase(dbId).then((db) => {
    const sources = db.data_sources.map((ds) => ds.id);
    if (!options?.noPrint) console.log(sources.join('\n'));
    return sources;
  });
}

export function extractPageId(input: string, options?: { noPrint?: boolean }) {
  if (!input || typeof input !== 'string') {
    if (!options?.noPrint) console.error('Invalid URL');
    return;
  }

  const pageId = input.replace(/.*([0-9a-f]{32}).*/i, '$1');
  const formattedId = _formatUuid(pageId);
  if (!options?.noPrint) console.log(formattedId);
  return formattedId;
}

export function extractDatabaseId(
  input: string,
  options?: { noPrint?: boolean },
) {
  if (!input || typeof input !== 'string') {
    console.error('Invalid URL');
  }

  const match = input.match(/[0-9a-f]{32}/);
  const dbId = match?.[0];
  if (!match || dbId === undefined) {
    if (!options?.noPrint) console.error('No database ID found');
    return;
  }

  const formattedId = _formatUuid(dbId);
  if (!options?.noPrint) console.log(formattedId);
  return formattedId;
}

export function extractBlockId(
  urlWithBlock: string,
  options?: { noPrint?: boolean },
) {
  if (!urlWithBlock || typeof urlWithBlock !== 'string') {
    console.error('Invalid URL');
    return;
  }

  const blockMatch = urlWithBlock.match(/#(?:block-)?([0-9a-f]{32})/i);
  if (blockMatch && blockMatch[1]) {
    const formattedId = _formatUuid(blockMatch[1]);
    if (!options?.noPrint) console.log(formattedId);
    return formattedId;
  }

  console.error('No block ID found');
}

function _formatUuid(input: string) {
  return input
    .toLowerCase()
    .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
}
