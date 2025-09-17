import type { BuiltFilter } from './filter-builder.js';
import type * as Notion from './notion-types.js';

export type PropOptions = {
  remove?: {
    /** Removes created by and last edited by user ids from the page(s). */
    userIds?: boolean;
    /** Removes created time and last edited time from the page(s). */
    pageTimestamps?: boolean;
    url?: boolean;
    publicUrl?: boolean;
    objectType?: boolean;
    id?: boolean;
    icon?: boolean;
    cover?: boolean;
    archived?: boolean;
    parent?: boolean;
    inTrash?: boolean;
    customProps?: string[];
  };
  /** Allows only explicitly listed props to be kept. */
  keep?: string[];
  /** Moves nested properties to the top level of the page(s). */
  simplifyProps?: boolean;
  /** Makes the icon into an URL string no matter if it's an emoji or file. */
  simpleIcon?: boolean;
};

export type SortOption = {
  property: string;
  direction: 'ascending' | 'descending';
};

export type QueryOptions = {
  filter?: BuiltFilter;
  propOptions?: PropOptions;
  sort?: SortOption | SortOption[];
  /** How many items to fetch at a time. Defaults to 100. */
  batchSize?: number;
  includeTrashed?: boolean;
  includeArchived?: boolean;

  notionToken?: string;
  notionVersion?: string;
};

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
