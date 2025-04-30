import type {
  DatabaseObjectResponse,
  DatePropertyItemObjectResponse,
  PageObjectResponse,
} from '../notion-types.js';

export type VerboseDatabaseProperty = PageObjectResponse['properties'][number];

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
  in_trash?: boolean;
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

/** Represents a Notion API compatible emoji character. */
export type EmojiRequest = Extract<
  DatabaseObjectResponse['icon'],
  { type: 'emoji'; emoji: string }
>['emoji'];

export type TimeZoneRequest =
  NonNullable<DatePropertyItemObjectResponse['date']> extends {
    time_zone: infer T;
  }
    ? T
    : never;
