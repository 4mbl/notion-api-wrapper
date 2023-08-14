# Notion API Wrapper

## Example

1. Create new integration at https://www.notion.so/my-integrations

2. Give the integration permissions to read a database

3. Add the integration token to your `.env` file
```env
NOTION_API_KEY="secret_0000000000000000000000000000000000000000000"
NOTION_DATABASE_ID="00000000000000000000000000000000"
```

4. Query the database, for example:
```ts
const databaseId = process.env.NOTION_DATABASE_ID ?? "";
if (!databaseId) throw new Error("Invalid database id");
const data = queryDatabaseFull(databaseId);
console.log(await data)
```

---
You can also use the `FilterBuilder` to create filters that will be used in the query. For example:
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

const data = queryDatabaseFull(databaseId, myFilter);
```