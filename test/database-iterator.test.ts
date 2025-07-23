import { expect, test } from 'vitest';
import { NotionDatabase } from '../src';
import { afterEach, beforeEach } from 'node:test';
import dotenv from 'dotenv';
dotenv.config({ quiet: true });

const TESTING_API_KEY = process.env.TESTING_API_KEY;

const TESTING_DATABASE_ID = '16004341-ec56-4e03-97bd-75cbf6be6f91';

/* Require the notion token to be passed explicitly to avoid using the wrong token accidentally */
const initialEnvVars: Record<string, string | undefined> = {};
beforeEach(() => {
  initialEnvVars['NOTION_API_KEY'] = process.env.NOTION_API_KEY;
  process.env.NOTION_API_KEY = undefined;
});
afterEach(() => {
  process.env.NOTION_API_KEY = initialEnvVars['NOTION_API_KEY'];
});

/* END SETUP ============================== */

test('DatabaseIterator', async () => {
  const db = new NotionDatabase(TESTING_DATABASE_ID, {
    notionToken: TESTING_API_KEY,
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

  const resp5 = await interator.next();
  expect(resp5.done).toBe(true);
  expect(resp5.value).toBeUndefined();
});
