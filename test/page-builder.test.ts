import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  test,
} from 'vitest';
import dotenv from 'dotenv';
import { PageBuilder, queryDatabaseFull, trashPage } from '../src';
dotenv.config();

const TESTING_API_KEY = process.env.TESTING_API_KEY;

const PERSON_ID = process.env.TESTING_PERSON_ID;
if (!PERSON_ID) throw new Error('TESTING_PERSON_ID not set.');

const BUILER_TESTING_DATABASE_ID = '1d9fe0dc-f383-8046-aa56-c64b0fd84d9c'; //* NOTE: notion stores database id with dashes
const RELATION_PAGE_ID = '1d9fe0dc-f383-80a1-b222-cf59ca6e4aa6'; //* NOTE: notion stores page id with dashes

const SAMPLE_IMAGE_URL =
  'https://upload.wikimedia.org/wikipedia/commons/9/9f/Ara_macao_-Fort_Worth_Zoo-8.jpg';

test('PageBuilder with minimal data', async () => {
  const builder = new PageBuilder(BUILER_TESTING_DATABASE_ID, {
    notionToken: TESTING_API_KEY,
  });

  builder.title('Test Page with minimal data');

  const page = await builder.create();

  expect(page.object).toBeDefined();
  expect(page.id).toBeDefined();
  expect(page.created_time).toBeDefined();
  expect(page.last_edited_time).toBeDefined();
  expect(page.parent?.database_id).toBeDefined();
  expect(page.url).toBeDefined();

  expect(page.parent.database_id).equals(BUILER_TESTING_DATABASE_ID);

  const p = page.properties;
  expect(p['Name'].title[0].text.content).toEqual(
    'Test Page with minimal data',
  );

  // cleanup
  trashPage(page.id, { notionToken: TESTING_API_KEY });
});

test('PageBuilder with complete data - seperate methods', async () => {
  const builder = new PageBuilder(BUILER_TESTING_DATABASE_ID, {
    notionToken: TESTING_API_KEY,
  });

  builder.cover(SAMPLE_IMAGE_URL);
  builder.icon(SAMPLE_IMAGE_URL);

  builder.title('Test Page with all data - separate methods');
  builder.richText('Rich Text', 'Test Rich Text');
  builder.checkbox('Checkbox', true);
  builder.date('Date', '2025-01-01');
  builder.files('Files & Media', SAMPLE_IMAGE_URL);
  builder.multiSelect('Multi-Select', 'Option 1');
  builder.number('Number', 42);
  builder.people('People', PERSON_ID);
  builder.phoneNumber('Phone Number', '+1 (555) 555-5555');
  builder.relation('Relation', RELATION_PAGE_ID);
  builder.select('Select', 'Option 1');
  builder.status('Status', 'Done');
  builder.url('URL', 'https://example.com');

  const page = await builder.create();

  expect(page.object).toBeDefined();
  expect(page.id).toBeDefined();
  expect(page.created_time).toBeDefined();
  expect(page.last_edited_time).toBeDefined();
  expect(page.parent?.database_id).toBeDefined();
  expect(page.url).toBeDefined();

  expect(page.parent.database_id).equals(BUILER_TESTING_DATABASE_ID);

  expect(page.cover?.external?.url).toEqual(SAMPLE_IMAGE_URL);
  expect(page.icon?.external?.url).toEqual(SAMPLE_IMAGE_URL);

  const p = page.properties;
  expect(p['Name'].title[0].text.content).toEqual(
    'Test Page with all data - separate methods',
  );
  expect(p['Rich Text'].rich_text[0].text.content).toEqual('Test Rich Text');
  expect(p['Checkbox'].checkbox).toEqual(true);
  expect(p['Date'].date.start).toEqual('2025-01-01');
  expect(p['Date'].date.end).toEqual('2025-01-01');
  expect(p['Date'].date.time_zone).toEqual(null);
  expect(p['Files & Media'].files[0].external.url).toEqual(SAMPLE_IMAGE_URL);
  expect(p['Multi-Select'].multi_select[0].name).toEqual('Option 1');
  expect(p['Number'].number).toEqual(42);
  expect(p['People'].people[0].id).toEqual(PERSON_ID);
  expect(p['Phone Number'].phone_number).toEqual('+1 (555) 555-5555');
  expect(p['Relation'].relation[0].id).toEqual(RELATION_PAGE_ID);
  expect(p['Select'].select.name).toEqual('Option 1');
  expect(p['Status'].status.name).toEqual('Done');
  expect(p['URL'].url).toEqual('https://example.com');

  // cleanup
  trashPage(page.id, { notionToken: TESTING_API_KEY });
});

test('PageBuilder with complete data - using the `property` method', async () => {
  const builder = new PageBuilder(BUILER_TESTING_DATABASE_ID, {
    notionToken: TESTING_API_KEY,
  });

  builder.cover(SAMPLE_IMAGE_URL);
  builder.icon(SAMPLE_IMAGE_URL);

  builder.property(
    'title',
    'Name',
    'Test Page with all data - using property method',
  );
  builder.richText('Rich Text', 'Test Rich Text');
  builder.property('checkbox', 'Checkbox', true);
  builder.property('date', 'Date', '2025-01-01');
  builder.property('files', 'Files & Media', SAMPLE_IMAGE_URL);
  builder.property('multi_select', 'Multi-Select', 'Option 1');
  builder.property('number', 'Number', 42);
  builder.property('people', 'People', PERSON_ID);
  builder.property('phone_number', 'Phone Number', '+1 (555) 555-5555');
  builder.property('relation', 'Relation', RELATION_PAGE_ID);
  builder.property('select', 'Select', 'Option 1');
  builder.property('status', 'Status', 'Done');
  builder.property('url', 'URL', 'https://example.com');

  const page = await builder.create();

  expect(page.object).toBeDefined();
  expect(page.id).toBeDefined();
  expect(page.created_time).toBeDefined();
  expect(page.last_edited_time).toBeDefined();
  expect(page.parent?.database_id).toBeDefined();
  expect(page.url).toBeDefined();

  expect(page.parent.database_id).equals(BUILER_TESTING_DATABASE_ID); //* NOTE: notion stores database id with dashes

  expect(page.cover?.external?.url).toEqual(SAMPLE_IMAGE_URL);
  expect(page.icon?.external?.url).toEqual(SAMPLE_IMAGE_URL);

  const p = page.properties;
  expect(p['Name'].title[0].text.content).toEqual(
    'Test Page with all data - using property method',
  );
  expect(p['Rich Text'].rich_text[0].text.content).toEqual('Test Rich Text');
  expect(p['Checkbox'].checkbox).toEqual(true);
  expect(p['Date'].date.start).toEqual('2025-01-01');
  expect(p['Date'].date.end).toEqual('2025-01-01');
  expect(p['Date'].date.time_zone).toEqual(null);
  expect(p['Files & Media'].files[0].external.url).toEqual(SAMPLE_IMAGE_URL);
  expect(p['Multi-Select'].multi_select[0].name).toEqual('Option 1');
  expect(p['Number'].number).toEqual(42);
  expect(p['People'].people[0].id).toEqual(PERSON_ID);
  expect(p['Phone Number'].phone_number).toEqual('+1 (555) 555-5555');
  expect(p['Relation'].relation[0].id).toEqual(RELATION_PAGE_ID);
  expect(p['Select'].select.name).toEqual('Option 1');
  expect(p['Status'].status.name).toEqual('Done');
  expect(p['URL'].url).toEqual('https://example.com');

  // cleanup
  trashPage(page.id, { notionToken: TESTING_API_KEY });
});

test('PageBuilder with complete data - alternative data', async () => {
  const builder = new PageBuilder(BUILER_TESTING_DATABASE_ID, {
    notionToken: TESTING_API_KEY,
  });

  builder.icon('😀');

  builder.title('Test Page with all data - using alternative data');
  builder.checkbox('Checkbox', true);
  builder.date(
    'Date',
    ['2025-01-01T00:00:00.000Z', '2025-02-01T00:00:00.000Z'],
    'America/New_York',
  );

  builder.multiSelect('Multi-Select', ['Option 1', 'Option 2']);

  const page = await builder.create();

  expect(page.object).toBeDefined();
  expect(page.id).toBeDefined();
  expect(page.created_time).toBeDefined();
  expect(page.last_edited_time).toBeDefined();
  expect(page.parent?.database_id).toBeDefined();
  expect(page.url).toBeDefined();

  expect(page.parent.database_id).equals(BUILER_TESTING_DATABASE_ID);

  expect(page.icon?.emoji).toEqual('😀');

  const p = page.properties;
  expect(p['Name'].title[0].text.content).toEqual(
    'Test Page with all data - using alternative data',
  );
  expect(p['Checkbox'].checkbox).toEqual(true);
  expect(p['Date'].date.start).toEqual('2025-01-01T00:00:00.000-05:00');
  expect(p['Date'].date.end).toEqual('2025-02-01T00:00:00.000-05:00');
  expect(p['Multi-Select'].multi_select[0].name).toEqual('Option 1');
  expect(p['Multi-Select'].multi_select[1].name).toEqual('Option 2');
});

/* Require the notion token to be passed explicitly to avoid using the wrong token accidentally */
const initialEnvVars: Record<string, string | undefined> = {};
beforeEach(() => {
  initialEnvVars['NOTION_API_KEY'] = process.env.NOTION_API_KEY;
  process.env.NOTION_API_KEY = undefined;
});
afterEach(() => {
  process.env.NOTION_API_KEY = initialEnvVars['NOTION_API_KEY'];
});

afterAll(async () => {
  await cleanupOldPages();
});

async function cleanupOldPages() {
  const today = new Date();
  const cutoff = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 7,
  );

  const data = await queryDatabaseFull(BUILER_TESTING_DATABASE_ID, {
    notionToken: TESTING_API_KEY,
  });

  const promises = data.map(async (page) => {
    if (
      !(page as any).properties.Name.title[0].text.content.includes(
        '[[ DO NOT DELETE ]]',
      ) &&
      new Date((page as any).created_time) < cutoff
    ) {
      return await trashPage(page.id, { notionToken: TESTING_API_KEY });
    }
  });
  await Promise.all(promises);
}
