import { expect, test } from 'vitest';

import 'dotenv';
import { afterEach, beforeEach } from 'node:test';
import {
  FilterBuilder,
  retrieveDataSource,
  queryDataSource,
  searchFromDataSource,
  createPage,
} from '../src';
import { NotionError } from '../src/internal/errors';

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

test('create page - error - invalid property', async () => {
  try {
    await createPage(
      {
        parent: { data_source_id: TESTING_DATA_SOURCE_ID },
        properties: {
          'Invalid Property Name': {
            rich_text: [{ text: { content: '...' } }],
          },
        },
        content: [],
      },
      { notionToken: TESTING_TOKEN },
    );
    throw new Error('Expected createPage to fail, but it succeeded');
  } catch (err: any) {
    expect(err).toBeInstanceOf(NotionError);
    if (err instanceof NotionError) {
      expect(err.status).toBe(400);
      expect(err.code).toBe('validation_error');
      expect(err.message).toMatch(
        /Invalid Property Name is not a property that exists/,
      );
    }
  }
});

test('queryDataSource - notionToken', async () => {
  const { results } = await queryDataSource(TESTING_DATA_SOURCE_ID, {
    notionToken: TESTING_TOKEN,
    batchSize: 10,
    limit: 10,
  });
  expect(results).toHaveLength(10);
});

test('queryDataSource - environment variable', async () => {
  // NOTE: this is the only test that uses the env variable and not explicit token argument
  process.env.NOTION_TOKEN = TESTING_TOKEN;
  const { results } = await queryDataSource(TESTING_DATA_SOURCE_ID, {
    batchSize: 10,
    limit: 10,
  });
  expect(results).toHaveLength(10);
});

test('queryDataSource - filter', async () => {
  const fb = new FilterBuilder();
  fb.addFilter({ multi_select: { contains: 'A' }, property: 'Tags' });

  const { results } = await queryDataSource(TESTING_DATA_SOURCE_ID, {
    notionToken: TESTING_TOKEN,
    batchSize: 10,
    limit: 100,
    filter: fb.build('AND'),
  });
  expect(results).toHaveLength(6);
});

test('queryDataSource - sort', async () => {
  const { results } = await queryDataSource(TESTING_DATA_SOURCE_ID, {
    notionToken: TESTING_TOKEN,
    batchSize: 10,
    limit: 100,
    sort: {
      direction: 'ascending',
      property: 'ID',
    },
  });
  expect((results[0] as any).properties.Name.title[0].plain_text).toBe('One');
  expect((results[3] as any).properties.Name.title[0].plain_text).toBe('Four');
  expect((results[6] as any).properties.Name.title[0].plain_text).toBe('Seven');
});

test('queryDataSource - prop options', async () => {
  const { results } = await queryDataSource(TESTING_DATA_SOURCE_ID, {
    notionToken: TESTING_TOKEN,
    batchSize: 10,
    limit: 100,
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

  const pageA = results[0] as any;

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

  const { results: results2 } = await queryDataSource(TESTING_DATA_SOURCE_ID, {
    notionToken: TESTING_TOKEN,
    batchSize: 10,
    limit: 100,
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

  const pageB = results2[0] as any;

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

test('queryDataSource - prop keep', async () => {
  const { results } = await queryDataSource(TESTING_DATA_SOURCE_ID, {
    notionToken: TESTING_TOKEN,
    batchSize: 10,
    limit: 100,
    sort: {
      direction: 'ascending',
      property: 'ID',
    },
    propOptions: {
      keep: ['Name'],
    },
  });

  const pageNine = results[8] as any;

  expect(pageNine.properties.Name.title[0].plain_text).toBe('Nine');
  expect(pageNine.properties.ID).toBeUndefined();
  expect(pageNine.properties.Tags).toBeUndefined();
});

test('queryDataSource - prop simplify', async () => {
  const { results } = await queryDataSource(TESTING_DATA_SOURCE_ID, {
    notionToken: TESTING_TOKEN,
    batchSize: 10,
    limit: 100,
    sort: {
      direction: 'ascending',
      property: 'ID',
    },
    propOptions: {
      simpleIcon: true,
      simplifyProps: true,
    },
  });

  const pageThree = results[2] as any;
  expect(pageThree.Name).toBe('Three');
  expect(pageThree.ID).toBe('ID-3');
  expect(pageThree.Tags[0]).toBe('A');
});

test('queryDataSource - full', async () => {
  const { results } = await queryDataSource(TESTING_DATA_SOURCE_ID, {
    notionToken: TESTING_TOKEN,
    batchSize: 10,
  });
  expect(results).toHaveLength(20);
});

test('searchFromDataSource', async () => {
  const { results } = await searchFromDataSource(
    TESTING_DATA_SOURCE_ID,
    { query: 'Thirteen' },
    { notionToken: TESTING_TOKEN },
  );

  const match = results[0] as any;
  expect(match.properties.Name.title[0].plain_text).toBe('Thirteen');
});

test('searchFromDataSource - custom prop', async () => {
  const { results } = await searchFromDataSource(
    TESTING_DATA_SOURCE_ID,
    { query: '14th page', property: 'Description' },
    {
      notionToken: TESTING_TOKEN,
    },
  );

  const match = results[0] as any;
  expect(match.properties.Name.title[0].plain_text).toBe('Fourteen');
});

test('retrieveDataSource', async () => {
  const results = await retrieveDataSource(TESTING_DATA_SOURCE_ID, {
    notionToken: TESTING_TOKEN,
  });

  expect(results.title[0].plain_text).toBe('NAW TESTING DATABASE');
  expect(results.description[0].plain_text).contains('NAW');
  expect(results.properties.Name).toBeDefined();
  expect(results.properties.ID).toBeDefined();
  expect(results.properties.Tags).toBeDefined();
  expect(results.properties.Description).toBeDefined();
});
