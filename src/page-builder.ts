import { NOTION_VERSION } from './constants.js';
import {
  E,
  AuthenticationError,
  NotionError,
  NotionRateLimitError,
  ParameterValidationError,
} from './internal/errors.js';

import type {
  EmojiRequest,
  SimpleDatabaseProperty,
  TimeZoneRequest,
} from './naw-types.js';
import {
  isArrayOfStrings,
  isBoolean,
  isEmoji,
  isNumber,
  isObjectId,
  isString,
  isUrl,
} from './validation.js';
import type { CreatePageParameters } from './notion-types.js';

// More descriptive type names for anyone using the library.

/** A Notion API compatible emoji character. */
type Emoji = EmojiRequest;
type TimeZone = TimeZoneRequest;
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
  data: CreatePageParameters;
  notionToken: string;
  notionVersion: string;

  constructor(
    parentId: string,
    options?: { notionToken?: string; notionVersion?: string },
  ) {
    if (!isObjectId(parentId))
      throw new ParameterValidationError(E.INVALID_PARENT_ID);

    const apiKey = options?.notionToken ?? process.env.NOTION_API_KEY;
    if (!apiKey) throw new AuthenticationError(E.NO_API_KEY);
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
    return this;
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
        emoji: icon as EmojiRequest,
      };
    } else {
      throw new ParameterValidationError(
        'Icon must be a string or an emoji. If you want to use an image, use the URL.',
      );
    }
    return this;
  }

  // PROPERTIES //

  property(type: PropertyType, key: PropertyKey, value: PropertyValue) {
    switch (type) {
      case 'title':
        if (!isString(value))
          throw new ParameterValidationError(E.INVALID_VALUE);
        return this.title(value);
      case 'rich_text':
        if (!isString(value))
          throw new ParameterValidationError(E.INVALID_VALUE);
        return this.richText(key, value);
      case 'checkbox':
        if (!isBoolean(value))
          throw new ParameterValidationError(E.INVALID_VALUE);
        return this.checkbox(key, value);
      case 'date':
        if (
          // prettier-ignore
          !isString(value)
          || (Array.isArray(value) && value.length === 1 && !isString(value[0]))
          || (Array.isArray(value) && value.length === 2 && !isString(value[0]) && !isString(value[1]))
          || (Array.isArray(value) && value.length > 2)
        ) {
          throw new ParameterValidationError(E.INVALID_VALUE);
        }
        return this.date(key, value);
      case 'files':
        if (!isString(value) && !isArrayOfStrings(value))
          throw new ParameterValidationError(E.INVALID_VALUE);
        return this.files(key, value);
      case 'multi_select':
        if (!isString(value) && !isArrayOfStrings(value))
          throw new ParameterValidationError(E.INVALID_VALUE);
        return this.multiSelect(key, value);
      case 'number':
        if (!isNumber(value))
          throw new ParameterValidationError(E.INVALID_VALUE);
        return this.number(key, value);
      case 'people':
        if (!isString(value) && !isArrayOfStrings(value))
          throw new ParameterValidationError(E.INVALID_VALUE);
        return this.people(key, value);
      case 'phone_number':
        if (!isString(value))
          throw new ParameterValidationError(E.INVALID_VALUE);
        return this.phoneNumber(key, value);
      case 'relation':
        if (!isString(value) && !isArrayOfStrings(value))
          throw new ParameterValidationError(E.INVALID_VALUE);
        return this.relation(key, value);
      case 'select':
        if (!isString(value))
          throw new ParameterValidationError(E.INVALID_VALUE);
        return this.select(key, value);
      case 'status':
        if (!isString(value))
          throw new ParameterValidationError(E.INVALID_VALUE);
        return this.status(key, value);
      case 'url':
        if (!isString(value))
          throw new ParameterValidationError(E.INVALID_VALUE);
        return this.url(key, value);
      default:
        throw new ParameterValidationError(
          `Unsupported property type: ${type}`,
        );
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
    return this;
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
    return this;
  }

  checkbox(key: PropertyKey, value: boolean) {
    this.data.properties[key] = {
      checkbox: value,
    };
    return this;
  }

  date(
    key: PropertyKey,
    value: string | [string, string],
    timezone?: TimeZone,
  ) {
    this.data.properties[key] = {
      type: 'date',
      date: {
        start: Array.isArray(value) ? value[0] : value,
        end: Array.isArray(value) && value.length === 2 ? value[1] : undefined,
        time_zone: timezone ?? null,
      },
    };
    return this;
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
    return this;
  }

  multiSelect(key: PropertyKey, value: string | string[]) {
    const val = Array.isArray(value) ? value : [value];
    this.data.properties[key] = {
      multi_select: val.map((v: string) => ({
        name: v,
      })),
    };
    return this;
  }

  number(key: PropertyKey, value: number) {
    this.data.properties[key] = {
      number: value,
    };
    return this;
  }

  people(key: PropertyKey, value: string | string[]) {
    const val = Array.isArray(value) ? value : [value];
    this.data.properties[key] = {
      people: val.map((v: string) => ({
        id: v,
      })),
    };
    return this;
  }

  phoneNumber(key: PropertyKey, value: string) {
    this.data.properties[key] = {
      phone_number: value,
    };
    return this;
  }

  relation(key: PropertyKey, value: string | string[]) {
    const val = Array.isArray(value) ? value : [value];
    this.data.properties[key] = {
      relation: val.map((v: string) => ({
        id: v,
      })),
    };
    return this;
  }

  select(key: PropertyKey, value: string) {
    this.data.properties[key] = {
      select: {
        name: value,
      },
    };
    return this;
  }

  status(key: PropertyKey, value: string) {
    this.data.properties[key] = {
      status: {
        name: value,
      },
    };
    return this;
  }

  url(key: PropertyKey, value: string) {
    if (!isUrl(value)) throw new ParameterValidationError('Invalid URL.');

    this.data.properties[key] = {
      url: value,
    };
    return this;
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
      throw new NotionRateLimitError(E.RATE_LIMIT);
    }

    if (!response.ok) {
      throw new NotionError(
        `Error creating page: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }
}
