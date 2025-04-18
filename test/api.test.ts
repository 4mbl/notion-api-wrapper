import { expect, test } from 'vitest';
import {
  getDatabaseColumns,
  queryDatabase,
  queryDatabaseFull,
  searchFromDatabase,
} from '../src/api/query';
import dotenv from 'dotenv';
import { DatabaseIterator, FilterBuilder } from '../src';
dotenv.config();

const TESTING_API_KEY = process.env.TESTING_API_KEY;

const TESTING_DATABASE_ID = '16004341ec564e0397bd75cbf6be6f91';

test('queryDatabase with notionToken', async () => {
  const prevNotionApiKey = process.env.NOTION_API_KEY;
  process.env.NOTION_API_KEY = undefined;

  const resp = await queryDatabase(TESTING_DATABASE_ID, undefined, {
    notionToken: TESTING_API_KEY,
    batchSize: 10,
  });
  expect(resp.data.results).toHaveLength(10);

  process.env.NOTION_API_KEY = prevNotionApiKey;
});

test('queryDatabase with environment variable', async () => {
  const prevNotionApiKey = process.env.NOTION_API_KEY;
  process.env.NOTION_API_KEY = process.env.TESTING_API_KEY;

  const resp = await queryDatabase(TESTING_DATABASE_ID, undefined, {
    batchSize: 10,
  });
  expect(resp.data.results).toHaveLength(10);

  process.env.NOTION_API_KEY = prevNotionApiKey;
});

test('queryDatabase with filter', async () => {
  const fb = new FilterBuilder();
  fb.addFilter({ multi_select: { contains: 'A' }, property: 'Tags' });

  const resp = await queryDatabase(TESTING_DATABASE_ID, undefined, {
    notionToken: TESTING_API_KEY,
    batchSize: 10,
    filter: fb.build('AND'),
  });
  expect(resp.data.results).toHaveLength(6);
});

test('queryDatabase with sort', async () => {
  const resp = await queryDatabase(TESTING_DATABASE_ID, undefined, {
    notionToken: TESTING_API_KEY,
    batchSize: 10,
    sort: {
      direction: 'ascending',
      property: 'ID',
    },
  });
  expect(
    (resp.data.results[0] as any).properties.Name.title[0].plain_text,
  ).toBe('One');
  expect(
    (resp.data.results[3] as any).properties.Name.title[0].plain_text,
  ).toBe('Four');
  expect(
    (resp.data.results[6] as any).properties.Name.title[0].plain_text,
  ).toBe('Seven');
});

test('queryDatabase with prop options', async () => {
  const resp = await queryDatabase(TESTING_DATABASE_ID, undefined, {
    notionToken: TESTING_API_KEY,
    batchSize: 10,
    propOptions: {
      remove: {
        id: true,
        userIds: true,
        pageTimestamps: true,
        url: true,
        publicUrl: true,
        objectType: true,
        icon: true,
        cover: true,
        archived: true,
        parent: true,
        inTrash: true,
        customProps: ['ID'],
      },
    },
  });

  const pageA = resp.data.results[0] as any;

  expect(pageA.id).toBeUndefined();
  expect(pageA.created_by).toBeUndefined();
  expect(pageA.last_edited_by).toBeUndefined();
  expect(pageA.created_time).toBeUndefined();
  expect(pageA.last_edited_time).toBeUndefined();
  expect(pageA.url).toBeUndefined();
  expect(pageA.public_url).toBeUndefined();
  expect(pageA.object).toBeUndefined();
  expect(pageA.icon).toBeUndefined();
  expect(pageA.cover).toBeUndefined();
  expect(pageA.archived).toBeUndefined();
  expect(pageA.parent).toBeUndefined();
  expect(pageA.in_trash).toBeUndefined();
  expect(pageA.properties.ID).toBeUndefined();

  expect(pageA.properties.Name).toBeDefined();
  expect(pageA.properties.Tags).toBeDefined();

  const resp2 = await queryDatabase(TESTING_DATABASE_ID, undefined, {
    notionToken: TESTING_API_KEY,
    batchSize: 10,
    propOptions: {
      remove: {
        id: false,
        userIds: false,
        pageTimestamps: false,
        url: false,
        publicUrl: false,
        objectType: false,
        icon: false,
        cover: false,
        archived: false,
        parent: false,
        inTrash: false,
        customProps: [],
      },
    },
  });

  const pageB = resp2.data.results[0] as any;

  expect(pageB.id).toBeDefined();
  expect(pageB.created_by).toBeDefined();
  expect(pageB.last_edited_by).toBeDefined();
  expect(pageB.created_time).toBeDefined();
  expect(pageB.last_edited_time).toBeDefined();
  expect(pageB.url).toBeDefined();
  expect(pageB.public_url).toBeDefined();
  expect(pageB.object).toBeDefined();
  expect(pageB.icon).toBeDefined();
  expect(pageB.cover).toBeDefined();
  expect(pageB.archived).toBeDefined();
  expect(pageB.parent).toBeDefined();
  expect(pageB.in_trash).toBeDefined();
  expect(pageB.properties.ID).toBeDefined();

  expect(pageB.properties.Name).toBeDefined();
  expect(pageB.properties.Tags).toBeDefined();
});

test('queryDatabase with prop keep', async () => {
  const resp = await queryDatabase(TESTING_DATABASE_ID, undefined, {
    notionToken: TESTING_API_KEY,
    batchSize: 10,
    sort: {
      direction: 'ascending',
      property: 'ID',
    },
    propOptions: {
      keep: ['Name'],
    },
  });

  const pageNine = resp.data.results[8] as any;

  expect(pageNine.properties.Name.title[0].plain_text).toBe('Nine');
  expect(pageNine.properties.ID).toBeUndefined();
  expect(pageNine.properties.Tags).toBeUndefined();
});

test('queryDatabase with prop simplify', async () => {
  const resp = await queryDatabase(TESTING_DATABASE_ID, undefined, {
    notionToken: TESTING_API_KEY,
    batchSize: 10,
    sort: {
      direction: 'ascending',
      property: 'ID',
    },
    propOptions: {
      simpleIcon: true,
      simplifyProps: true,
    },
  });

  const pageThree = resp.data.results[2] as any;
  expect(pageThree.Name).toBe('Three');
  expect(pageThree.ID).toBe('ID-3');
  expect(pageThree.Tags[0]).toBe('A');
});

test('queryDatabase with pagination', async () => {
  const resp = await queryDatabase(TESTING_DATABASE_ID, undefined, {
    notionToken: TESTING_API_KEY,
    batchSize: 10,
  });
  expect(resp.cursor).toBeDefined();
  expect(resp.data.has_more).toBe(true);
  expect(resp.data.results).toHaveLength(10);

  const resp2 = await queryDatabase(TESTING_DATABASE_ID, resp.cursor, {
    notionToken: TESTING_API_KEY,
    batchSize: 10,
  });
  expect(resp2.cursor).toBeNull();
  expect(resp2.data.has_more).toBe(false);
  expect(resp2.data.results).toHaveLength(10);
});

test('queryDatabaseFull', async () => {
  const resp = await queryDatabaseFull(TESTING_DATABASE_ID, {
    notionToken: TESTING_API_KEY,
    batchSize: 10,
  });
  expect(resp).toHaveLength(20);
});

test('searchFromDatabase', async () => {
  const resp = await searchFromDatabase(
    TESTING_DATABASE_ID,
    { query: 'Thirteen' },
    { notionToken: TESTING_API_KEY },
  );

  const match = resp.results[0] as any;
  expect(match.properties.Name.title[0].plain_text).toBe('Thirteen');
});

test('searchFromDatabase with custom prop', async () => {
  const resp = await searchFromDatabase(
    TESTING_DATABASE_ID,
    { query: '14th page', property: 'Description' },
    {
      notionToken: TESTING_API_KEY,
    },
  );

  const match = resp.results[0] as any;
  expect(match.properties.Name.title[0].plain_text).toBe('Fourteen');
});

test('getDatabaseColumns', async () => {
  const resp = await getDatabaseColumns(TESTING_DATABASE_ID, {
    notionToken: TESTING_API_KEY,
  });

  expect(resp.url).toBe('https://www.notion.so/' + TESTING_DATABASE_ID);
  expect(resp.title[0].plain_text).toBe('NAW TESTING DATABASE');
  expect(resp.description[0].plain_text).contains('NAW');
  expect(resp.properties.Name).toBeDefined();
  expect(resp.properties.ID).toBeDefined();
  expect(resp.properties.Tags).toBeDefined();
  expect(resp.properties.Description).toBeDefined();
});

test('DatabaseIterator', async () => {
  const db = new DatabaseIterator(TESTING_DATABASE_ID, {
    notionToken: TESTING_API_KEY,
    batchSize: 10,
    yieldSize: 5,
    sort: {
      direction: 'ascending',
      property: 'ID',
    },
  });

  const resp1 = await db.next();
  expect(resp1.done).toBe(false);
  expect(resp1.value.length).toBe(5);
  expect(resp1.value[0].properties.Name.title[0].plain_text).toBe('One');

  const resp2 = await db.next();
  expect(resp2.done).toBe(false);
  expect(resp2.value.length).toBe(5);
  expect(resp2.value[0].properties.Name.title[0].plain_text).toBe('Six');

  const resp3 = await db.next();
  expect(resp3.done).toBe(false);
  expect(resp3.value.length).toBe(5);
  expect(resp3.value[0].properties.Name.title[0].plain_text).toBe('Eleven');

  const resp4 = await db.next();
  expect(resp4.done).toBe(false);
  expect(resp4.value.length).toBe(5);
  expect(resp4.value[0].properties.Name.title[0].plain_text).toBe('Sixteen');

  const resp5 = await db.next();
  expect(resp5.done).toBe(true);
  expect(resp5.value).toBeUndefined();
});
