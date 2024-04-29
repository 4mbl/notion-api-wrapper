# Notion API Wrapper

> Making Notion API a bit easier to use.

* [Installation](#installation)
* [Getting Started](#getting-started)
  * [Querying Database](#querying-database)
  * [Filtering Results](#filtering-results)
  * [Field and Prop Options](#field-and-prop-options)
* [Advanced Usage](#advanced-usage)
  * [Pagination](#pagination)
  * [Database Search](#database-search)
  * [Database Metadata](#database-metadata)

## Installation

```bash
npm install notion-api-wrapper
```

_Or your favorite package manager, in which case you probably know the command._

## Getting Started

### Querying Database

1. Create new integration at <https://www.notion.so/my-integrations>. Write down the secret key, you will need it to authenticate the API requests that this package makes. You can revoke the key at any time in the URL above.

2. Give the integration permissions to read the database you want to query. You can do this in the database page: `⋯` → `Connection To` → `<Integration Name>`.

3. Create `.env` file in your project root directory with your credentials.

    ```env
    NOTION_API_KEY="secret_0000000000000000000000000000000000000000000"
    NOTION_DATABASE_ID="00000000000000000000000000000000"
    ```

    Database ID is the alphanumeric string in the URL after the workspace name. For instance, in the URL: `https://www.notion.so/workspace/00000000000000000000000000000000?v=1111111111111111111111111111111`, the database ID is `00000000000000000000000000000000`. While it's not mandatory to store it in the .env file, the following examples assume that you have done so.

4. Query the database.

    ```ts
    const data = await queryDatabaseFull(process.env.NOTION_DATABASE_ID);
    const json = JSON.stringify(data, null, 2);
    console.log(json)
    ```

### Filtering Results

You can also use the `FilterBuilder` to create filters that will be used in the query.

```ts
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

const myFilter: Filter = new FilterBuilder()
  .addFilter(filterA)
  .addFilter(
    new FilterBuilder().addFilter(filterB).addFilter(filterC).build('OR')
  )
  .build('AND');

const data = queryDatabaseFull(process.env.NOTION_DATABASE_ID, {
    filter: myFilter,
});
```

### Field and Prop Options

There is also options to remove built-in fields and props from the results. Here is a kitchen sink example of that.

```ts
const data = queryDatabaseFull(process.env.NOTION_DATABASE_ID, {
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
  }
});
```

You can also remove all props except certain ones by using the `keep` option.

```ts
const data = queryDatabaseFull(process.env.NOTION_DATABASE_ID, {
  keep: ['Name', 'Tags', 'Done'],
});
```

Notion API responses can be quite verbose, so there is also options to simplify the results.

```ts
const data = queryDatabaseFull(process.env.NOTION_DATABASE_ID, {
  simplifyProps: true,
  simpleIcon: true,
});
```

## Advanced Usage

### Pagination

There is also a function to query the database in a paginated way. A single query returns at most 100 records.

```ts
const { data, nextCursor } = queryDatabase(process.env.NOTION_DATABASE_ID);
const { data2 } = queryDatabase(process.env.NOTION_DATABASE_ID, nextCursor);
```

### Database Search

You can search the database with the `searchFromDatabase` function. This supports some of the same options as the query functions.

```ts
const data = searchFromDatabase(process.env.NOTION_DATABASE_ID, 'kiwi')
```

By default the search uses the `Name` property, but you can specify a different property with a third argument. The search looks for excact matches, but you can also use the `contains` option to search for partial matches.

### Database Metadata

You can get database metadata with the `getDatabaseColumns` function. This supports some of the same options as the query functions.

```ts
const columns = await getDatabaseColumns(process.env.NOTION_DATABASE_ID);
```
