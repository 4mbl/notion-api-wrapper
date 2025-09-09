import fs from 'fs';
import path from 'path';
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import { execSync } from 'child_process';
import { __cleanupOldDbPages } from './utils';
import dotenv from 'dotenv';
dotenv.config({ quiet: true });

const markdownPath = path.resolve(__dirname, '../README.md');
const markdownContent = fs.readFileSync(markdownPath, 'utf-8');
const testDirectory = path.join(__dirname, '.gen');
const ast = unified().use(remarkParse).parse(markdownContent);
const codeBlocks: string[] = [];

const DOCTEST_TESTING_DATABASE_ID = '1fcfe0dc-f383-802b-adc9-e8b299a39b20'; //* NOTE: notion stores database id with dashes
const DOCTEST_TESTING_PAGE_ID = '1fcfe0dc-f383-80b6-af53-c545bc932d29'; //* NOTE: notion stores database id with dashes

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
  await __cleanupOldDbPages({
    databaseId: DOCTEST_TESTING_DATABASE_ID,
    apiKey: process.env.TESTING_API_KEY!,
  });
});

visit(ast, 'code', (node) => {
  if (node.meta?.includes('skip-test')) return;
  if (node.lang !== 'ts' && node.lang !== 'typescript') return;

  codeBlocks.push(node.value);
});

describe('Markdown TypeScript code blocks', () => {
  codeBlocks.forEach((code, index) => {
    it(`runs code block #${index + 1}`, () => {
      const tempPath = path.join(testDirectory, `t${index}.ts`);
      fs.writeFileSync(
        tempPath,
        `import dotenv from 'dotenv';dotenv.config({quiet:true});` +
          `process.env.NOTION_TOKEN='${process.env.TESTING_NOTION_TOKEN}';` +
          `process.env.NOTION_PAGE_ID='${DOCTEST_TESTING_PAGE_ID}';` +
          `process.env.NOTION_DATABASE_ID='${DOCTEST_TESTING_DATABASE_ID}';\n` +
          code
            .replace("'notion-api-wrapper'", "'../../dist/index.js'")
            .replaceAll('PERSON_ID', 'TESTING_PERSON_ID')
            .replaceAll('RELATION_PAGE_ID', 'NOTION_PAGE_ID'),
      );

      const result = execSync(`node ${tempPath}`);
      expect(result).toBeDefined();
    });
  });
});
