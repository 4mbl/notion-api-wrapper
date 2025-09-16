import { expect, test } from 'vitest';

import 'dotenv';
import { afterEach, beforeEach } from 'node:test';
import {
  FilterBuilder,
  retrieveDataSource,
  queryDataSource,
  queryDataSourceFull,
  searchFromDataSource,
} from '../src';

const TESTING_TOKEN = process.env.TESTING_NOTION_TOKEN;
if (!TESTING_TOKEN) throw new Error('TESTING_NOTION_TOKEN not set.');

const TESTING_DATA_SOURCE_ID = '8b00d89e35574a3780afa2e929d7a80c';

/* Require the notion token to be passed explicitly to avoid using the wrong token accidentally */
const initialEnvVars: Record<string, string | undefined> = {};
beforeEach(() => {
  initialEnvVars['NOTION_TOKEN'] = process.env.NOTION_TOKEN;
  process.env.NOTION_TOKEN = undefined;
});
afterEach(() => {
  process.env.NOTION_TOKEN = initialEnvVars['NOTION_TOKEN'];
});

/* END SETUP ============================== */

test('queryDataSource with notionToken', async () => {
  const resp = await queryDataSource(TESTING_DATA_SOURCE_ID, undefined, {
    notionToken: TESTING_TOKEN,
    batchSize: 10,
  });
  expect(resp.data.results).toHaveLength(10);
});

test('queryDataSource with environment variable', async () => {
  // NOTE: this is the only test that uses the env variable and not explicit token argument
  process.env.NOTION_TOKEN = TESTING_TOKEN;
  const resp = await queryDataSource(TESTING_DATA_SOURCE_ID, undefined, {
    batchSize: 10,
  });
  expect(resp.data.results).toHaveLength(10);
});

test('queryDatabase with filter', async () => {
  const fb = new FilterBuilder();
  fb.addFilter({ multi_select: { contains: 'A' }, property: 'Tags' });

  const resp = await queryDataSource(TESTING_DATA_SOURCE_ID, undefined, {
    notionToken: TESTING_TOKEN,
    batchSize: 10,
    filter: fb.build('AND'),
  });
  expect(resp.data.results).toHaveLength(6);
});

test('queryDataSource with sort', async () => {
  const resp = await queryDataSource(TESTING_DATA_SOURCE_ID, undefined, {
    notionToken: TESTING_TOKEN,
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

test('queryDataSource with prop options', async () => {
  const resp = await queryDataSource(TESTING_DATA_SOURCE_ID, undefined, {
    notionToken: TESTING_TOKEN,
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

  const resp2 = await queryDataSource(TESTING_DATA_SOURCE_ID, undefined, {
    notionToken: TESTING_TOKEN,
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

test('queryDataSource with prop keep', async () => {
  const resp = await queryDataSource(TESTING_DATA_SOURCE_ID, undefined, {
    notionToken: TESTING_TOKEN,
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

test('queryDataSource with prop simplify', async () => {
  const resp = await queryDataSource(TESTING_DATA_SOURCE_ID, undefined, {
    notionToken: TESTING_TOKEN,
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

test('queryDataSource with pagination', async () => {
  const resp = await queryDataSource(TESTING_DATA_SOURCE_ID, undefined, {
    notionToken: TESTING_TOKEN,
    batchSize: 10,
  });
  expect(resp.cursor).toBeDefined();
  expect(resp.data.has_more).toBe(true);
  expect(resp.data.results).toHaveLength(10);

  const resp2 = await queryDataSource(TESTING_DATA_SOURCE_ID, resp.cursor, {
    notionToken: TESTING_TOKEN,
    batchSize: 10,
  });
  expect(resp2.cursor).toBeNull();
  expect(resp2.data.has_more).toBe(false);
  expect(resp2.data.results).toHaveLength(10);
});

test('queryDataSourceFull', async () => {
  const resp = await queryDataSourceFull(TESTING_DATA_SOURCE_ID, {
    notionToken: TESTING_TOKEN,
    batchSize: 10,
  });
  expect(resp).toHaveLength(20);
});

test('searchFromDataSource', async () => {
  const resp = await searchFromDataSource(
    TESTING_DATA_SOURCE_ID,
    { query: 'Thirteen' },
    { notionToken: TESTING_TOKEN },
  );

  const match = resp.results[0] as any;
  expect(match.properties.Name.title[0].plain_text).toBe('Thirteen');
});

test('searchFromDataSource with custom prop', async () => {
  const resp = await searchFromDataSource(
    TESTING_DATA_SOURCE_ID,
    { query: '14th page', property: 'Description' },
    {
      notionToken: TESTING_TOKEN,
    },
  );

  const match = resp.results[0] as any;
  expect(match.properties.Name.title[0].plain_text).toBe('Fourteen');
});

test('retrieveDataSource', async () => {
  const resp = await retrieveDataSource(TESTING_DATA_SOURCE_ID, {
    notionToken: TESTING_TOKEN,
  });

  expect(resp.title[0].plain_text).toBe('NAW TESTING DATABASE');
  expect(resp.description[0].plain_text).contains('NAW');
  expect(resp.properties.Name).toBeDefined();
  expect(resp.properties.ID).toBeDefined();
  expect(resp.properties.Tags).toBeDefined();
  expect(resp.properties.Description).toBeDefined();
});
