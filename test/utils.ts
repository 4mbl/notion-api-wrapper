import { queryDatabaseFull, trashPage } from '../src';

export async function __cleanupOldDbPages(opts: {
  databaseId: string;
  apiKey: string;
}) {
  const today = new Date();
  const cutoff = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 7,
  );

  const data = await queryDatabaseFull(opts.databaseId, {
    notionToken: opts.apiKey,
  });

  const promises = data.map(async (page) => {
    if (
      !(page as any).properties.Name.title[0].text.content.includes(
        '[[ DO NOT DELETE ]]',
      ) &&
      new Date((page as any).created_time) < cutoff
    ) {
      return await trashPage(page.id, { notionToken: opts.apiKey });
    }
  });
  await Promise.all(promises);
}
