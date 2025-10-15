import { queryDataSource, trashPage } from '../src';

export async function __cleanupOldDataSourcePages(opts: {
  dataSourceId: string;
  apiKey: string;
}) {
  const today = new Date();
  const cutoff = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 7,
  );

  const { results } = await queryDataSource(opts.dataSourceId, {
    notionToken: opts.apiKey,
  });

  const promises = results
    .filter(
      (page) =>
        !(page as any).properties.Name.title
          .map((t: any) => t.plain_text)
          .join('')
          .includes('[[ DO NOT DELETE ]]') &&
        new Date((page as any).created_time) < cutoff,
    )
    .map(async (page) => trashPage(page.id, { notionToken: opts.apiKey }));

  await Promise.allSettled(promises);
}
