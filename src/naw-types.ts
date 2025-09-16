import type { Notion } from './notion-types.js';

export type VerboseProperty = Notion.PageObjectResponse['properties'][number];

export type SimpleDatabasePage = {
  object: 'page';
  id: string;
  created_time?: string;
  last_edited_time?: string;
  created_by?: { object: 'user'; id: string };
  last_edited_by?: { object: 'user'; id: string };
  cover?: string;
  icon?: string;
  parent?: { type: 'database_source_id'; database_source_id: string };
  archived?: boolean;
  url?: string;
  publicUrl?: string;
  in_trash?: boolean;
} & SimpleProperties;

export type SimpleProperties = {
  [key: string]: SimpleProperty;
};

export type SimpleProperty =
  | string
  | number
  | null
  | boolean
  | Date
  | [Date, Date]
  | (string | number | null | boolean | Date)[];

/** Represents a Notion API compatible emoji character. */
export type EmojiRequest = Extract<
  Notion.DatabaseObjectResponse['icon'],
  { type: 'emoji'; emoji: string }
>['emoji'];

export type TimeZoneRequest =
  NonNullable<Notion.DatePropertyItemObjectResponse['date']> extends {
    time_zone: infer T;
  }
    ? T
    : never;
