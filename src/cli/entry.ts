#!/usr/bin/env node
import { argv } from 'node:process';

import {
  extractBlockId,
  extractDatabaseId,
  extractPageId,
  fetchDataSources,
  type Command,
} from './index.js';

const commands: Record<string, Command> = {
  'fetch datasources': {
    run: fetchDataSources,
    description: 'Fetch datasource IDs from a database URL or database ID',
  },
  'get page-id': {
    run: extractPageId,
    description: 'Extract a page ID from a page URL',
  },
  'get database-id': {
    run: extractDatabaseId,
    description: 'Extract a database ID from a database URL',
  },
  'get block-id': {
    run: extractBlockId,
    description: 'Extract a block ID from a page URL',
  },
};

function showHelp() {
  console.log('\nUsage:\n  naw <command> <subcommand> <argument>\n\nCommands:');
  for (const [key, { description }] of Object.entries(commands)) {
    console.log(`  ${key.padEnd(25)} ${description}`);
  }
  console.log('');
}

function main() {
  const [, , cmd, subcmd, arg] = argv;
  const key = [cmd, subcmd].filter(Boolean).join(' ');
  const command = commands[key];

  if (!command) {
    console.error(`Unknown command: ${cmd}`);
    showHelp();
    process.exit(1);
  }

  if (!arg) {
    console.error('Missing argument');
    showHelp();
    process.exit(1);
  }

  command.run(arg);
}

main();
