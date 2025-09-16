# Notion API Wrapper

> Zero dependency Notion API client.

* [Installation](#installation)
* [Getting Started](#getting-started)
  * [Basic Page Operations](#basic-page-operations)
  * [Querying Data Sources](#querying-data-sources)
  * [Filtering Results](#filtering-results)
  * [Sorting Results](#sorting-results)
  * [Field and Property Options](#field-and-property-options)
* [Advanced Usage](#advanced-usage)
  * [Pagination](#pagination)
  * [Data Source Search](#data-source-search)
  * [Data Source Metadata](#data-source-metadata)
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
> Data Sources are now the primary way to access data in Notion. This package supports this new API version.
>
> See [the docs](https://developers.notion.com/docs/upgrade-guide-2025-09-03) for more information.

### Basic Page Operations

This package provides helpers to create, update, trash, and fetch pages.

```ts
import { createPage, getPage, updatePage, trashPage } from 'notion-api-wrapper';

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

const pageId = newPage.id;

const existingPage = await getPage(pageId);

const updatedPage = await updatePage(pageId, { icon: { emoji: '🎁' } });

const trashedPage = await trashPage(pageId);
```

### Querying Data Sources

1. Create new integration at <https://www.notion.so/my-integrations>. You will need it to authenticate the API requests that this package makes. You can revoke the key at any time in the URL above.

2. Give the integration permissions to read the database you want to query. You can do this in the database page: `⋯` → `Connection To` → `<Integration Name>`.

3. Make the secret key available as an environment variable under the name `NOTION_TOKEN`. You may also pass it as a parameter to the functions using the `notionToken` parameter. The examples below also assume that you have set a data source ID as an environment variable called `NOTION_DATA_SOURCE_ID`.

   You can find the data source ID from the settings of the database page on Notion.

   <!-- You can find the database ID in the URL of the database page. For instance, in the URL: `https://www.notion.so/<workspace>/00000000000000000000000000000000?v=1111111111111111111111111111111`, the database ID is `00000000000000000000000000000000`. -->

4. Query the data source.

   ```ts
   import { queryDataSourceFull } from 'notion-api-wrapper';

   const data = await queryDataSourceFull(process.env.NOTION_DATA_SOURCE_ID);
   const json = JSON.stringify(data, null, 2);
   console.log(json);
   ```

   If you want to pass the secret key as a parameter, you can do so by passing the `notionToken` option.

   ```ts
   import { queryDataSourceFull } from 'notion-api-wrapper';

   const data = await queryDataSourceFull(process.env.NOTION_DATA_SOURCE_ID, {
     notionToken: process.env.NOTION_TOKEN,
   });
   ```

### Filtering Results

You can also use the `FilterBuilder` to create filters that will be used in the query.

```ts
import { queryDataSourceFull, FilterBuilder } from 'notion-api-wrapper';

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

const data = await queryDataSourceFull(process.env.NOTION_DATA_SOURCE_ID, {
  filter: myFilter,
});
```

### Sorting Results

You can also sort the results by specifying the `sort` option.

```ts
import { queryDataSourceFull } from 'notion-api-wrapper';

const data = await queryDataSourceFull(process.env.NOTION_DATA_SOURCE_ID, {
  sort: {
    direction: 'ascending',
    property: 'Name',
  },
});
```

### Field and Property Options

There is also options to remove built-in fields and properties from the results. Here is a kitchen sink example of that.

```ts
import { queryDataSourceFull } from 'notion-api-wrapper';

const data = await queryDataSourceFull(process.env.NOTION_DATA_SOURCE_ID, {
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

You can also remove all properties except certain ones by using the `keep` option.

```ts
import { queryDataSourceFull } from 'notion-api-wrapper';

const data = await queryDataSourceFull(process.env.NOTION_DATA_SOURCE_ID, {
  propOptions: {
    keep: ['Name', 'Tags', 'Done'],
  },
});
```

Notion API responses can be quite verbose, so there is also options to simplify the results.

```ts
import { queryDataSourceFull } from 'notion-api-wrapper';

const data = await queryDataSourceFull(process.env.NOTION_DATA_SOURCE_ID, {
  propOptions: {
    simplifyProps: true,
    simpleIcon: true,
  },
});
```

## Advanced Usage

### Pagination

There is also a function to query the data source in a paginated way. A single query returns at most 100 pages.

```ts
import { queryDataSource } from 'notion-api-wrapper';

const { data, cursor } = await queryDataSource(
  process.env.NOTION_DATA_SOURCE_ID,
);
const { data: data2 } = await queryDataSource(
  process.env.NOTION_DATA_SOURCE_ID,
  cursor,
);
```

### Data Source Search

You can easily search a data source for a matching page by using the `searchFromDataSource` function.

```ts
import { searchFromDataSource } from 'notion-api-wrapper';

const data = await searchFromDataSource(process.env.NOTION_DATA_SOURCE_ID, {
  query: 'kiwi',
});
```

By default the search uses the `Name` property, but you can specify a different property. By default the search looks for excact matches, but you can modify this behavior too.

```ts
import { searchFromDataSource } from 'notion-api-wrapper';

const data = await searchFromDataSource(process.env.NOTION_DATA_SOURCE_ID, {
  query: 'Vegetab',
  property: 'Name', // title property
  match: 'startsWith',
});
```

### Data Source Metadata

You can get Data Source metadata with the `retrieveDataSource` function. This supports some of the same options as the query functions.

```ts
import { retrieveDataSource } from 'notion-api-wrapper';

const columns = await retrieveDataSource(process.env.NOTION_DATA_SOURCE_ID);
```

### Data Source Iterator

This package also provides a `NotionDataSource` class that can be used to iterate over the Data Source in a paginated way.

```ts
import { NotionDataSource } from 'notion-api-wrapper';

const db = new NotionDataSource(process.env.NOTION_DATA_SOURCE_ID);

for await (const page of db.iterator()) {
  console.log(page.id);
}
```

By default the iterator yields each page individually. You can pass the `yieldSize` option to control the number of pages that will be yielded at a time to the caller.

```ts
import { NotionDataSource } from 'notion-api-wrapper';

const db = new NotionDataSource(process.env.NOTION_DATA_SOURCE_ID);

for await (const chunk of db.iterator({ yieldSize: 10 })) {
  const firstPage = chunk[0];
  console.log(firstPage.id);
}
```

The `batchSize` option controls the number of pages fetched at once from Notion and `yieldSize` the number of pages that will be yielded at a time to the caller. By default both are set to 1. If you set `yieldSize` to a value other than the default of 1, you will get the results in an array instead of as a bare object as before.

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

This package also provides a `PageBuilder` class that can be used to create pages in a Data Source.

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

In addition to creating pages, you can also use the `PageBuilder` to fetch, update, and trash existing pages.

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

You can also seed the builder directly from a page response (e.g., from the Data Source iterator) so you only need to specify the properties you want to change. Existing properties and metadata will be preserved automatically:

```ts skip-test
import { PageBuilder } from 'notion-api-wrapper';

const builder = PageBuilder.from(existingPage);
builder.title('Updated Title');
await builder.update(existingPage.id);
```
