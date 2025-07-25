# Notion API Wrapper

> Zero dependency Notion API client.

* [Installation](#installation)
* [Getting Started](#getting-started)
  * [Basic Page Operations](#basic-page-operations)
  * [Querying Database](#querying-database)
  * [Filtering Results](#filtering-results)
  * [Sorting Results](#sorting-results)
  * [Field and Property Options](#field-and-property-options)
* [Advanced Usage](#advanced-usage)
  * [Pagination](#pagination)
  * [Database Search](#database-search)
  * [Database Metadata](#database-metadata)
  * [Database Iterator](#database-iterator)
  * [Database Builder](#database-builder)

## Installation

```bash
npm install notion-api-wrapper
```

_Or your favorite package manager, in which case you probably know the command._

## Getting Started

### Basic Page Operations

This package provides helpers to create, update, trash, and fetch pages.

```ts
import { createPage, getPage, updatePage, trashPage } from 'notion-api-wrapper';

const newPage = await createPage({
  parent: { database_id: process.env.NOTION_DATABASE_ID },
  properties: {},
  content: [
    {
      type: 'paragraph',
      paragraph: { rich_text: [{ text: { content: 'Hello, world!' } }] },
    },
  ],
});

const pageId = newPage.id;

const existingPage = await getPage(pageId);

const updatedPage = await updatePage(pageId, { icon: { emoji: '🎁' } });

const trashedPage = await trashPage(pageId);
```

### Querying Database

1. Create new integration at <https://www.notion.so/my-integrations>. Write down the secret key, you will need it to authenticate the API requests that this package makes. You can revoke the key at any time in the URL above.

2. Give the integration permissions to read the database you want to query. You can do this in the database page: `⋯` → `Connection To` → `<Integration Name>`.

3. Make the secret key available as an environment variable under the name `NOTION_API_KEY`. You may also pass it as a parameter to the functions using the `notionToken` parameter. The examples below also assume that you have set the database ID as an environment variable called `NOTION_DATABASE_ID`.

   You can find the database ID in the URL of the database page. For instance, in the URL: `https://www.notion.so/<workspace>/00000000000000000000000000000000?v=1111111111111111111111111111111`, the database ID is `00000000000000000000000000000000`.

4. Query the database.

   ```ts
   import { queryDatabaseFull } from 'notion-api-wrapper';

   const data = await queryDatabaseFull(process.env.NOTION_DATABASE_ID);
   const json = JSON.stringify(data, null, 2);
   console.log(json);
   ```

   If you want to pass the secret key as a parameter, you can do so by passing the `notionToken` option.

   ```ts
   import { queryDatabaseFull } from 'notion-api-wrapper';

   const data = await queryDatabaseFull(process.env.NOTION_DATABASE_ID, {
     notionToken: process.env.NOTION_API_KEY,
   });
   ```

### Filtering Results

You can also use the `FilterBuilder` to create filters that will be used in the query.

```ts
import { queryDatabaseFull, Filter, FilterBuilder } from 'notion-api-wrapper';

const filterA: Filter = {
  property: 'Done',
  checkbox: {
    equals: true,
  },
};

const filterB: Filter = {
  property: 'Tags',
  multi_select: {
    contains: 'A',
  },
};

const filterC: Filter = {
  property: 'Tags',
  multi_select: {
    contains: 'B',
  },
};

const myFilter = new FilterBuilder()
  .addFilter(filterA)
  .addFilter(
    new FilterBuilder().addFilter(filterB).addFilter(filterC).build('OR'),
  )
  .build('AND');

const data = await queryDatabaseFull(process.env.NOTION_DATABASE_ID, {
    filter: myFilter,
});
```

### Sorting Results

You can also sort the results by specifying the `sort` option.

```ts
import { queryDatabaseFull } from 'notion-api-wrapper';

const data = await queryDatabaseFull(process.env.NOTION_DATABASE_ID, {
  sort: {
    direction: 'ascending',
    property: 'Name',
  },
});
```

### Field and Property Options

There is also options to remove built-in fields and properties from the results. Here is a kitchen sink example of that.

```ts
import { queryDatabaseFull } from 'notion-api-wrapper';

const data = await queryDatabaseFull(process.env.NOTION_DATABASE_ID, {
  propOptions: {
    remove: {
    userIds: true,
    pageTimestamps: true,
    url: true,
    publicUrl: true,
    objectType: true,
    id: true,
    icon: true,
    cover: true,
    archived: true,
    parent: true,
    inTrash: true,
    customProps: ['Description', 'Priority'],
    },
  }
});
```

You can also remove all properties except certain ones by using the `keep` option.

```ts
import { queryDatabaseFull } from 'notion-api-wrapper';

const data = await queryDatabaseFull(process.env.NOTION_DATABASE_ID, {
  propOptions: {
    keep: ['Name', 'Tags', 'Done'],
  },
});
```

Notion API responses can be quite verbose, so there is also options to simplify the results.

```ts
import { queryDatabaseFull } from 'notion-api-wrapper';

const data = await queryDatabaseFull(process.env.NOTION_DATABASE_ID, {
  propOptions: {
    simplifyProps: true,
    simpleIcon: true,
  },
});
```

## Advanced Usage

### Pagination

There is also a function to query the database in a paginated way. A single query returns at most 100 pages.

```ts
import { queryDatabase } from 'notion-api-wrapper';

const { data, nextCursor } = await queryDatabase(
  process.env.NOTION_DATABASE_ID,
);
const { data2 } = await queryDatabase(
  process.env.NOTION_DATABASE_ID,
  nextCursor,
);
```

### Database Search

You can easily search a database for a matching page by using the `searchFromDatabase` function.

```ts
import { searchFromDatabase } from 'notion-api-wrapper';

const data = await searchFromDatabase(process.env.NOTION_DATABASE_ID, {
  query: 'kiwi',
});
```

By default the search uses the `Name` property, but you can specify a different property. By default the search looks for excact matches, but you can modify this behavior too.

```ts
import { searchFromDatabase } from 'notion-api-wrapper';

const data = await searchFromDatabase(process.env.NOTION_DATABASE_ID, {
  query: 'Vegetab',
  property: 'Name', // title property
  match: 'startsWith',
});
```

### Database Metadata

You can get database metadata with the `getDatabaseColumns` function. This supports some of the same options as the query functions.

```ts
import { getDatabaseColumns } from 'notion-api-wrapper';

const columns = await getDatabaseColumns(process.env.NOTION_DATABASE_ID);
```

### Database Iterator

This package also provides a `DatabaseIterator` class that can be used to iterate over the database in a paginated way.

```ts
import { NotionDatabase } from 'notion-api-wrapper';

const db = new NotionDatabase(process.env.NOTION_DATABASE_ID);

for await (const page of db.iterator()) {
  const firstTitle =
    page.properties.Name.type === 'title'
      ? page.properties.Name.title
          .map((t: any) => t.plain_text)
          .join('')
      : undefined;
}
```

The `batchSize` option controls the number of pages fetched at once from Notion and `yieldSize` the number of pages that will be yielded at a time to the caller. By default both are set to 1.

```ts
import { NotionDatabase } from 'notion-api-wrapper';

const db = new NotionDatabase(process.env.NOTION_DATABASE_ID);

for await (const chunk of db.iterator({ batchSize: 10, yieldSize: 2 })) {
  const tenTitles = chunk
    .map((c) =>
      c.properties.Name.type === 'title'
        ? c.properties.Name.title
          .map((t: any) => t.plain_text)
          .join('')
        : undefined,
    )
    .filter((text) => text !== undefined);
}
```

You can also pass a custom response type to the `NotionDatabase` constructor. This can enable more specifc types with the cost of type safety.

```ts
import { NotionDatabase } from 'notion-api-wrapper';

type CustomType = PageObjectResponse & {
  properties: { Name: { title: { plain_text: string }[] } };
};

const db = new NotionDatabase<CustomType>(process.env.NOTION_DATABASE_ID);

for await (const page of db.iterator()) {
  /* ... */
}
```

### Database Builder

This package also provides a `PageBuilder` class that can be used to create pages in a database.

```ts
import { PageBuilder } from 'notion-api-wrapper';

const builder = new PageBuilder(process.env.NOTION_DATABASE_ID)

.cover('https://example.com/image.png')

.icon('🎁')
// emoji or image url:
// .icon("https://example.com/image.png")

.title('This is a Title')
.richText('Rich Text', 'Test Rich Text')
.checkbox('Checkbox', true)
.date('Date', '2025-01-01')
.files('Files & Media', 'https://example.com/image.png')
.multiSelect('Multi-Select', ['Option 1', 'Option 2'])
.number('Number', 42)
.people('People', process.env.PERSON_ID)
.phoneNumber('Phone Number', '+1 (555) 555-5555')
.relation('Relation', process.env.RELATION_PAGE_ID)
.select('Select', 'Option A')
.status('Status', 'Done')
.url('URL', 'https://example.com');

const page = await builder.create();
```

In addition to creating pages, you can also use the `PageBuilder` to fetch, update, and trash existing pages.

```ts
import { PageBuilder, createPage } from 'notion-api-wrapper';

const dummyPage = await createPage({
  parent: { database_id: process.env.NOTION_DATABASE_ID },
  properties: {},
  content: [],
});

const builder = new PageBuilder(process.env.NOTION_DATABASE_ID);

const existingPage = await builder.fetch(dummyPage.id);

builder.title('Updated Title');
const updatedPage = await builder.update(dummyPage.id);

const trashedPage = await builder.trash(dummyPage.id);
```
