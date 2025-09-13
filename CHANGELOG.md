# notion-api-wrapper

## 6.0.0-beta.0

### Major Changes

- 19b613b: Change default yieldSize to 1
- 19b613b: Return the bare result when DatabaseIterator yieldSize is 1
- 19b613b: Use actual date objects for date props instead of strings
- 19b613b: Refactor DatabaseIterator and rename it to NotionDatabase
- 19b613b: Change environment variable to look for from NOTION_API_KEY to NOTION_TOKEN
- 19b613b: Switch to modern ESM output
- 19b613b: Set minimum supported node version to 20

### Minor Changes

- 19b613b: Validate page and database ids
- 19b613b: Allow chaining with page builder
- 19b613b: Improve error consistency
- 19b613b: Expose getter for page builder data
- 19b613b: Add fetch, update, trash support to PageBuilder
- 19b613b: Implement PageBuilder
- 19b613b: Implement trashPage
- 19b613b: Expose get and update functions
- 19b613b: Expose create page function
- 19b613b: Implement PageBuilder.from

### Patch Changes

- 19b613b: Update examples
- 19b613b: Pass auth options to get page and create page from page builder
- 19b613b: Improve typings
- 19b613b: Improve database iterator typing
- 19b613b: Default end date to null in page builder
