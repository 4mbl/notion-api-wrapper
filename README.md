# Notion API Wrapper

> Zero dependency Notion API client.

* [Installation](#installation)
* [Getting Started](#getting-started)
* [Auth](#auth)
* [Basics](#basics)
  * [Page Operations](#page-operations)
  * [Querying Data Sources](#querying-data-sources)
  * [Filtering Results](#filtering-results)
  * [Sorting Results](#sorting-results)
  * [Field and Property Options](#field-and-property-options)
  * [Data Source Search](#data-source-search)
  * [Data Source Metadata](#data-source-metadata)
* [Client](#client)
* [Advanced Usage](#advanced-usage)
  * [Pagination](#pagination)
  * [Data Source Iterator](#data-source-iterator)
  * [Page Builder](#page-builder)

## Installation

```bash
npm install notion-api-wrapper
```

_Or your favorite package manager, in which case you probably know the command._

## Getting Started

> [!NOTE]
> Notion API version 2025-09-03 changed how databases work.
> Data Sources are now the primary way to access structured data in Notion. This package supports this new API version.
>
> See [the docs](https://developers.notion.com/docs/upgrade-guide-2025-09-03) for more information.

## Auth

1. Create new integration at <https://www.notion.so/my-integrations>. You will need it to authenticate the API requests that you make with this package. You can revoke the Notion API token at any time in the same URL.

2. Give the integration permissions to read the databases or pages you want to access. You can do this in the databases or pages at: `⋯` → `Connection To` → `<Integration Name>`.

3. Make the Notion API token available as an environment variable under the name `NOTION_TOKEN`. You may also pass it as a parameter to the functions using the `notionToken` parameter. The examples below assume that you have set a Data Source ID as an environment variable called `NOTION_DATA_SOURCE_ID`.

<!-- You can find the database ID in the URL of the database page. For instance, in the URL: `https://www.notion.so/<workspace>/00000000000000000000000000000000?v=1111111111111111111111111111111`, the database ID is `00000000000000000000000000000000`. -->

## Basics

### Page Operations

This package provides helpers to retrieve, create, update, and trash pages.

```ts
import {
  createPage,
  retrievePage,
  updatePage,
  trashPage,
} from 'notion-api-wrapper';

const newPage = await createPage({
  parent: {
    data_source_id: process.env.NOTION_DATA_SOURCE_ID,
  },
  properties: {},
  content: [
    {
      type: 'paragraph',
      paragraph: { rich_text: [{ text: { content: 'Hello, world!' } }] },
    },
  ],
});

const existingPage = await retrievePage(newPage.id);

const updatedPage = await updatePage(newPage.id, { icon: { emoji: '🎁' } });

const trashedPage = await trashPage(newPage.id);
```

### Querying Data Sources

You can find the Data Source ID from the settings of the database page on Notion.

```ts
import { queryDataSource } from 'notion-api-wrapper';

const data = await queryDataSource(process.env.NOTION_DATA_SOURCE_ID);
```

If you want to explicitly pass the Notion API token as a parameter, you can do so with the `notionToken` option. If `notionToken` is not provided, the `NOTION_TOKEN` environment variable will be used.

```ts
import { queryDataSource } from 'notion-api-wrapper';

const data = await queryDataSource(process.env.NOTION_DATA_SOURCE_ID, {
  notionToken: process.env.NOTION_TOKEN,
});
```

### Filtering Results

You can use `FilterBuilder` to create filters that will be used in the query.

```ts
import { queryDataSource, FilterBuilder } from 'notion-api-wrapper';

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

// property `Done` is true AND (property `Tags` contains `A` OR property `Tags` contains `B`)

const data = await queryDataSource(process.env.NOTION_DATA_SOURCE_ID, {
  filter: myFilter,
});
```

### Sorting Results

You can sort the results by specifying the `sort` option.

```ts
import { queryDataSource } from 'notion-api-wrapper';

const data = await queryDataSource(process.env.NOTION_DATA_SOURCE_ID, {
  sort: {
    direction: 'ascending',
    property: 'Name',
  },
});
```

By default the primary (title) property will be used for sorting.

### Field and Property Options

There are options to remove built-in fields and properties from the results. Here is a kitchen sink example of that.

```ts
import { queryDataSource } from 'notion-api-wrapper';

const data = await queryDataSource(process.env.NOTION_DATA_SOURCE_ID, {
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
  },
});
```

You can remove all properties except certain ones by using the `keep` option.

```ts
import { queryDataSource } from 'notion-api-wrapper';

const data = await queryDataSource(process.env.NOTION_DATA_SOURCE_ID, {
  propOptions: {
    keep: ['Name', 'Tags', 'Done'],
  },
});
```

Notion API responses can be quite verbose, so there are options to simplify the results.

```ts
import { queryDataSource } from 'notion-api-wrapper';

const data = await queryDataSource(process.env.NOTION_DATA_SOURCE_ID, {
  propOptions: {
    simplifyProps: true,
    simpleIcon: true,
  },
});
```

### Data Source Search

You can easily search a Data Source for a matching page by using the `searchFromDataSource` function.

```ts
import { searchFromDataSource } from 'notion-api-wrapper';

const data = await searchFromDataSource(process.env.NOTION_DATA_SOURCE_ID, {
  query: 'kiwi',
});
```

By default the search uses the `Name` property, but you can specify a different property. By default the search looks for excact matches, but you can modify that behavior too.

```ts
import { searchFromDataSource } from 'notion-api-wrapper';

const data = await searchFromDataSource(process.env.NOTION_DATA_SOURCE_ID, {
  query: 'Vegetab',
  property: 'Name',
  match: 'startsWith',
});
```

### Data Source Metadata

Data Source metadata can be obtained with the `retrieveDataSource` function. This supports some of the same options as the query functions.

```ts
import { retrieveDataSource } from 'notion-api-wrapper';

const columns = await retrieveDataSource(process.env.NOTION_DATA_SOURCE_ID);
```

## Client

The `NotionClient` class provides an alternative way to access the functions described above.

```ts
import { NotionClient } from 'notion-api-wrapper';

const notion = new NotionClient({
  notionToken: process.env.NOTION_TOKEN,
});

const dataSource = await notion.dataSources.retrieve(
  process.env.NOTION_DATA_SOURCE_ID,
);

const data = await notion.dataSources.query(process.env.NOTION_DATA_SOURCE_ID);

const matches = await notion.dataSources.search(
  process.env.NOTION_DATA_SOURCE_ID,
  { query: 'kiwi' },
);

const created = await notion.pages.create({
  parent: {
    data_source_id: process.env.NOTION_DATA_SOURCE_ID,
  },
  properties: {},
  children: [],
});

const retrieved = await notion.pages.retrieve(created.id);

const updated = await notion.pages.update(created.id, {
  icon: { emoji: '🎁' },
});

const trashed = await notion.pages.trash(created.id);
```

## Advanced Usage

### Pagination

There is a function to query the Data Source in a paginated way. A single query returns at most 100 pages.

By default `queryDataSource` returns all pages in the Data Source. This may result in many requests to the Notion API. To avoid this, you can manually paginate the results.

```ts
import { queryDataSource } from 'notion-api-wrapper';

const { data, cursor } = await queryDataSource(
  process.env.NOTION_DATA_SOURCE_ID,
  { limit: 100 },
);
const { data: data2 } = await queryDataSource(
  process.env.NOTION_DATA_SOURCE_ID,
  { limit: 100, cursor },
);
```

### Data Source Iterator

While managing the pagination manually is possible,
the `NotionDataSource` class provides a more convenient way to iterate over the Data Source.

```ts
import { NotionDataSource } from 'notion-api-wrapper';

const db = new NotionDataSource(process.env.NOTION_DATA_SOURCE_ID);

for await (const page of db.iterator()) {
  console.log(page.id);
}
```

By default the iterator yields each page individually. You can pass the `yieldSize` option to control the number of pages that will be yielded for each iteration. If you set `yieldSize` to a value other than the default of 1, you will get the results in an array instead of as a single object.

```ts
import { NotionDataSource } from 'notion-api-wrapper';

const db = new NotionDataSource(process.env.NOTION_DATA_SOURCE_ID);

for await (const chunk of db.iterator({ yieldSize: 10 })) {
  const firstPage = chunk[0];
  console.log(firstPage.id);
}
```

The `batchSize` option controls the number of pages fetched at once from Notion. This is set to 100 by default, which is also the maximum the Notion API allows.

```ts
import { NotionDataSource } from 'notion-api-wrapper';

const db = new NotionDataSource(process.env.NOTION_DATA_SOURCE_ID);

for await (const chunk of db.iterator({ batchSize: 10, yieldSize: 2 })) {
  chunk.map((page) => console.log(page.id));
}
```

You can also pass a custom response type to the `NotionDataSource` constructor. This can enable more specifc types with the cost of type safety.

```ts
import { NotionDataSource } from 'notion-api-wrapper';

type CustomType = PageObjectResponse & {
  properties: { Name: { title: { plain_text: string }[] } };
};

const db = new NotionDataSource<CustomType>(process.env.NOTION_DATA_SOURCE_ID);

for await (const page of db.iterator()) {
  /* ... */
}
```

### Page Builder

The `PageBuilder` class that can be used to create pages in a Data Source.

```ts
import { PageBuilder } from 'notion-api-wrapper';

const builder = new PageBuilder(process.env.NOTION_DATA_SOURCE_ID)

  .cover('https://example.com/image.png')

  .icon('🎁')
  // emoji or image url:
  // .icon("https://example.com/image.png")

  .title('This is a Title')
  .richText('Rich Text', 'Test Rich Text')
  .checkbox('Checkbox', true)
  .date('Date', new Date('2025-01-01'))
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

In addition to creating pages, `PageBuilder` can be used to fetch, update, and trash existing pages.

```ts
import { PageBuilder, createPage } from 'notion-api-wrapper';

const dummyPage = await createPage({
  parent: {
    data_source_id: process.env.NOTION_DATA_SOURCE_ID,
  },
  properties: {},
  children: [],
});

const builder = new PageBuilder(process.env.NOTION_DATA_SOURCE_ID);

const existingPage = await builder.fetch(dummyPage.id);

builder.title('Updated Title');
const updatedPage = await builder.update(dummyPage.id);

const trashedPage = await builder.trash(dummyPage.id);
```

You can seed the builder directly from a page response (e.g., from the Data Source iterator) so you only need to specify the properties you want to change. Existing properties and metadata will be preserved automatically:

```ts skip-test
import { PageBuilder } from 'notion-api-wrapper';

const builder = PageBuilder.from(existingPage);
builder.title('Updated Title');
await builder.update(existingPage.id);
```
