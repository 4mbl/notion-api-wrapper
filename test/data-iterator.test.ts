import { expect, test } from 'vitest';

import 'dotenv/config';
import { afterEach, beforeEach } from 'node:test';
import { NotionDataSource } from '../src';
import { __cleanupOldDataSourcePages } from './test-utils';

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

test('NotionDataSource - bare', async () => {
  const db = new NotionDataSource(TESTING_DATA_SOURCE_ID, {
    notionToken: TESTING_TOKEN,
    batchSize: 10,
    sort: {
      direction: 'ascending',
      property: 'ID',
    },
  });

  const interator = db.iterator();

  const resp1 = await interator.next();
  expect(resp1.done).toBe(false);
  expect(resp1.value.length).toBeUndefined();
  expect(resp1.value.properties.Name.title[0].plain_text).toBe('One');

  // database should have 20 values, so 19 left
  for (let i = 0; i < 19; i++) {
    await interator.next();
  }

  const respNoMore = await interator.next();
  expect(respNoMore.done).toBe(true);
  expect(respNoMore.value).toBeUndefined();
});

test('NotionDataSource - batches', async () => {
  const db = new NotionDataSource(TESTING_DATA_SOURCE_ID, {
    notionToken: TESTING_TOKEN,
    batchSize: 10,
    yieldSize: 5,
    sort: {
      direction: 'ascending',
      property: 'ID',
    },
  });

  const interator = db.iterator();

  const resp1 = await interator.next();
  expect(resp1.done).toBe(false);
  expect(resp1.value.length).toBe(5);
  expect(resp1.value[0].properties.Name.title[0].plain_text).toBe('One');

  const resp2 = await interator.next();
  expect(resp2.done).toBe(false);
  expect(resp2.value.length).toBe(5);
  expect(resp2.value[0].properties.Name.title[0].plain_text).toBe('Six');

  const resp3 = await interator.next();
  expect(resp3.done).toBe(false);
  expect(resp3.value.length).toBe(5);
  expect(resp3.value[0].properties.Name.title[0].plain_text).toBe('Eleven');

  const resp4 = await interator.next();
  expect(resp4.done).toBe(false);
  expect(resp4.value.length).toBe(5);
  expect(resp4.value[0].properties.Name.title[0].plain_text).toBe('Sixteen');

  const respNoMore = await interator.next();
  expect(respNoMore.done).toBe(true);
  expect(respNoMore.value).toBeUndefined();
});
