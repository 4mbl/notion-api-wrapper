import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { execSync } from 'child_process';
import fs from 'node:fs';
import path from 'node:path';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { __cleanupOldDataSourcePages } from './test-utils';

import 'dotenv/config';

const markdownPath = path.resolve(__dirname, '../README.md');
const markdownContent = fs.readFileSync(markdownPath, 'utf-8');
const testDirectory = path.join(__dirname, '.gen');
const ast = unified().use(remarkParse).parse(markdownContent);
const codeBlocks: string[] = [];

const DOCTEST_TESTING_DATA_SOURCE_ID = '1fcfe0dcf38381fb9cc9000b2e41c828'; //* NOTE: notion stores database id with dashes
const DOCTEST_TESTING_PAGE_ID = '269fe0dc-f383-80c1-8a3b-fe9bb3f02e97'; //* NOTE: notion stores database id with dashes

const TESTING_TOKEN = process.env.TESTING_NOTION_TOKEN;
if (!TESTING_TOKEN) throw new Error('TESTING_NOTION_TOKEN not set.');
const TESTING_PERSON_ID = process.env.TESTING_PERSON_ID;
if (!TESTING_PERSON_ID) throw new Error('TESTING_PERSON_ID not set.');

beforeAll(() => {
  if (fs.existsSync(testDirectory)) {
    fs.rmSync(testDirectory, { recursive: true });
  }
  fs.mkdirSync(testDirectory, { recursive: true });
});

afterAll(async () => {
  if (fs.existsSync(testDirectory)) {
    fs.rmSync(testDirectory, { recursive: true });
  }
  await __cleanupOldDataSourcePages({
    dataSourceId: DOCTEST_TESTING_DATA_SOURCE_ID,
    apiKey: process.env.TESTING_NOTION_TOKEN!,
  });
});

visit(ast, 'code', (node) => {
  if (node.meta?.includes('skip-test')) return;
  if (node.lang !== 'ts' && node.lang !== 'typescript') return;

  codeBlocks.push(node.value);
});

describe('Readme code blocks', () => {
  codeBlocks.forEach((code, index) => {
    it(`runs code block #${index + 1}`, () => {
      const tempPath = path.join(testDirectory, `t${index}.ts`);
      fs.writeFileSync(
        tempPath,
        `process.env.NOTION_TOKEN = '${TESTING_TOKEN}';\n` +
          `const NOTION_TOKEN='${TESTING_TOKEN}';\n` +
          `const PAGE_ID='${DOCTEST_TESTING_PAGE_ID}';\n` +
          `const DATA_SOURCE_ID='${DOCTEST_TESTING_DATA_SOURCE_ID}';\n` +
          `const PERSON_ID='${TESTING_PERSON_ID}';\n` +
          `const RELATION_PAGE='${DOCTEST_TESTING_PAGE_ID}';\n\n` +
          code.replace("'notion-api-wrapper'", "'../../dist/index.js'"),
      );

      const result = execSync(`node ${tempPath}`);
      expect(result).toBeDefined();
    });
  });
});
