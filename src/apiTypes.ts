import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export type VerboseDatabaseProperty = PageObjectResponse['properties'][0];

export type SimpleDatabasePage = {
  object: 'page';
  id: string;
  created_time?: string;
  last_edited_time?: string;
  created_by?: { object: 'user'; id: string };
  last_edited_by?: { object: 'user'; id: string };
  cover?: string;
  icon?: string;
  parent?: { type: 'database_id'; database_id: string };
  archived?: boolean;
  url?: string;
  publicUrl?: string;
} & SimpleDatabaseProperties;

export type SimpleDatabaseProperties = {
  [key: string]: SimpleDatabaseProperty;
};

export type SimpleDatabaseProperty =
  | string
  | number
  | null
  | boolean
  | (string | number | null | boolean)[];
