import { NOTION_VERSION } from './constants';
import { NO_API_KEY_ERROR } from './internal/errors';

import { EmojiRequest, SimpleDatabaseProperty } from './api/types';
import {
  isArrayOfStrings,
  isBoolean,
  isEmoji,
  isNumber,
  isString,
  isUrl,
} from './validation';

// More descriptive type names for anyone using the library.

/** A Notion API compatible emoji character. */
type Emoji = EmojiRequest;
/** Property id or name. Using the id is recommended to allow the end user to change the name of the property. */
type PropertyKey = string;
type PropertyValue = SimpleDatabaseProperty;

type PropertyType =
  | 'title'
  | 'rich_text'
  | 'checkbox'
  | 'date'
  | 'files'
  | 'multi_select'
  | 'number'
  | 'people'
  | 'phone_number'
  | 'relation'
  | 'select'
  | 'status'
  | 'url';

export class PageBuilder {
  /** Notion page id of the parent database. */
  data: any;
  notionToken: string;
  notionVersion: string;

  constructor(
    parentId: string,
    options?: { notionToken?: string; notionVersion?: string },
  ) {
    const apiKey = options?.notionToken ?? process.env.NOTION_API_KEY;
    if (!apiKey) throw new Error(NO_API_KEY_ERROR);
    this.notionToken = apiKey;

    this.notionVersion = options?.notionVersion ?? NOTION_VERSION;

    this.data = {
      parent: {
        type: 'database_id',
        database_id: parentId,
      },
      properties: {},
    };
  }

  // PAGE METADATA //

  cover(url: string) {
    this.data.cover = {
      type: 'external',
      external: {
        url,
      },
    };
  }

  icon(icon: string | Emoji) {
    if (isUrl(icon)) {
      this.data.icon = {
        type: 'external',
        external: {
          url: icon,
        },
      };
    } else if (isEmoji(icon)) {
      this.data.icon = {
        type: 'emoji',
        emoji: icon,
      };
    } else {
      throw new Error(
        'Icon must be a string or an emoji. If you want to use an image, use the URL.',
      );
    }
  }

  // PROPERTIES //

  property(type: PropertyType, key: PropertyKey, value: PropertyValue) {
    switch (type) {
      case 'title':
        if (!isString(value)) throw new Error('Invalid value.');
        return this.title(value);
      case 'rich_text':
        if (!isString(value)) throw new Error('Invalid value.');
        return this.richText(key, value);
      case 'checkbox':
        if (!isBoolean(value)) throw new Error('Invalid value.');
        return this.checkbox(key, value);
      case 'date':
        if (
          // prettier-ignore
          !isString(value)
          || (Array.isArray(value) && value.length === 1 && !isString(value[0]))
          || (Array.isArray(value) && value.length === 2 && !isString(value[0]) && !isString(value[1]))
          || (Array.isArray(value) && value.length > 2)
        ) {
          throw new Error('Invalid value.');
        }
        return this.date(key, value);
      case 'files':
        if (!isString(value) && !isArrayOfStrings(value))
          throw new Error('Invalid value.');
        return this.files(key, value);
      case 'multi_select':
        if (!isString(value) && !isArrayOfStrings(value))
          throw new Error('Invalid value.');
        return this.multiSelect(key, value);
      case 'number':
        if (!isNumber(value)) throw new Error('Invalid value.');
        return this.number(key, value);
      case 'people':
        if (!isString(value) && !isArrayOfStrings(value))
          throw new Error('Invalid value.');
        return this.people(key, value);
      case 'phone_number':
        if (!isString(value)) throw new Error('Invalid value.');
        return this.phoneNumber(key, value);
      case 'relation':
        if (!isString(value) && !isArrayOfStrings(value))
          throw new Error('Invalid value.');
        return this.relation(key, value);
      case 'select':
        if (!isString(value)) throw new Error('Invalid value.');
        return this.select(key, value);
      case 'status':
        if (!isString(value)) throw new Error('Invalid value.');
        return this.status(key, value);
      case 'url':
        if (!isString(value)) throw new Error('Invalid value.');
        return this.url(key, value);
      default:
        throw new Error(`Unsupported property type: ${type}`);
    }
  }

  title(value: string) {
    this.data.properties.Name = {
      title: [
        {
          text: {
            content: value,
          },
        },
      ],
    };
  }

  richText(key: PropertyKey, value: string) {
    this.data.properties[key] = {
      rich_text: [
        {
          text: {
            content: value,
          },
        },
      ],
    };
  }

  checkbox(key: PropertyKey, value: boolean) {
    this.data.properties[key] = {
      checkbox: value,
    };
  }

  date(
    key: PropertyKey,
    value: string | [string] | [string, string],
    timezone?: string,
  ) {
    const start = Array.isArray(value) ? value[0] : value;

    const end =
      Array.isArray(value) && value.length > 1
        ? value[1]
        : Array.isArray(value)
          ? value[0]
          : value;
    this.data.properties[key] = {
      date: {
        start: start,
        end: end,
        time_zone: timezone,
      },
    };
  }

  files(key: PropertyKey, value: string | string[]) {
    const val = typeof value === 'string' ? [value] : value;
    this.data.properties[key] = {
      files: val.map((url: string) => ({
        name: `file_${crypto.randomUUID()}`,
        external: {
          url,
        },
      })),
    };
  }

  multiSelect(key: PropertyKey, value: string | string[]) {
    const val = Array.isArray(value) ? value : [value];
    this.data.properties[key] = {
      multi_select: val.map((v: string) => ({
        name: v,
      })),
    };
  }

  number(key: PropertyKey, value: number) {
    this.data.properties[key] = {
      number: value,
    };
  }

  people(key: PropertyKey, value: string | string[]) {
    const val = Array.isArray(value) ? value : [value];
    this.data.properties[key] = {
      people: val.map((v: string) => ({
        id: v,
      })),
    };
  }

  phoneNumber(key: PropertyKey, value: string) {
    this.data.properties[key] = {
      phone_number: value,
    };
  }

  relation(key: PropertyKey, value: string | string[]) {
    const val = Array.isArray(value) ? value : [value];
    this.data.properties[key] = {
      relation: val.map((v: string) => ({
        id: v,
      })),
    };
  }

  select(key: PropertyKey, value: string) {
    this.data.properties[key] = {
      select: {
        name: value,
      },
    };
  }

  status(key: PropertyKey, value: string) {
    this.data.properties[key] = {
      status: {
        name: value,
      },
    };
  }

  url(key: PropertyKey, value: string) {
    if (!isUrl(value)) throw new Error('Invalid URL.');

    this.data.properties[key] = {
      url: value,
    };
  }

  /** Sends the API request to create the page using the data provided via the builder methods. */
  async create() {
    const response = await fetch(`https://api.notion.com/v1/pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.notionToken}`,
        'Notion-Version': this.notionVersion,
      },
      body: JSON.stringify(this.data),
    });

    if (response.status === 429) {
      throw new Error('Too many requests. Please try again later.');
    }

    if (!response.ok) {
      throw new Error(
        `Error creating page: ${response.status} ${response.statusText} ${await response.text()}`,
      );
    }

    const data = await response.json();
    return data;
  }
}
