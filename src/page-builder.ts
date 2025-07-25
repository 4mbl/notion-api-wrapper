import { NOTION_VERSION } from './constants.js';
import {
  E,
  AuthenticationError,
  NotionError,
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
import type {
  CreatePageParameters,
  PageObjectResponse,
  PartialPageObjectResponse,
} from './notion-types.js';
import { trashPage } from './api/delete.js';
import { updatePage } from './api/update.js';
import { getPage } from './api/get.js';
import { createPage } from './api/create.js';

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
  private data: Omit<CreatePageParameters, 'properties'> & {
    properties: NonNullable<CreatePageParameters['properties']>;
  };
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

  /** Creates a new page in the parent database with the data provided via the builder methods. */
  async create() {
    const data = await createPage(this.data, {
      notionToken: this.notionToken,
      notionVersion: this.notionVersion,
    });

    if (!data.id) {
      throw new NotionError('No page ID returned from Notion API.');
    }

    this._updateMetadata(data as PageObjectResponse);

    // don't return the page object if it is a partial response
    if (this._isPartialPageObjectResponse(data)) return undefined;

    return data as PageObjectResponse;
  }

  /** Fetches data of an existing page and updates this object with the property state. */
  async fetch(pageId: string) {
    const data = await getPage(pageId, {
      notionToken: this.notionToken,
      notionVersion: this.notionVersion,
    });

    if (!data.id) {
      throw new NotionError('No page ID returned from Notion API.');
    }

    this._updateMetadata(data as PageObjectResponse);

    return data;
  }

  /** Updates an existing page with the data provided via the builder methods. */
  async update(pageId: string) {
    const data = await updatePage(pageId, this.data, {
      notionToken: this.notionToken,
      notionVersion: this.notionVersion,
    });

    if (!this._isPartialPageObjectResponse(data)) {
      this._updateMetadata(data);
    }

    return data;
  }

  /** Trashes the page with the given ID. */
  async trash(pageId: string) {
    const data = await trashPage(pageId, {
      notionToken: this.notionToken,
      notionVersion: this.notionVersion,
    });

    this._clearMetadata();

    return data;
  }

  private _isPartialPageObjectResponse(
    data: PageObjectResponse | PartialPageObjectResponse,
  ): data is PartialPageObjectResponse {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return !(data as any).created_time;
  }

  private _isFullPageObjectResponse(
    data: PageObjectResponse | PartialPageObjectResponse,
  ): data is PageObjectResponse {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return !!(data as any).created_time;
  }

  private _updateMetadata(metadata: PageObjectResponse) {
    if (!this._isFullPageObjectResponse(metadata)) return;

    this.data.properties = this._transformPropertiesResponseToRequest(
      metadata.properties,
    );

    if (metadata.icon?.type !== 'file') {
      this.data.icon = metadata.icon;
    }

    if (metadata.cover?.type !== 'file') {
      this.data.cover = metadata.cover;
    }
  }

  private _clearMetadata() {
    this.data.properties = {};
    this.data.icon = undefined;
    this.data.cover = undefined;
  }

  private _transformPropertiesResponseToRequest(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input: Record<string, any>,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(input)) {
      const { type } = value;

      switch (type) {
        case 'title':
          result[key] = {
            title: value.title,
            type,
          };
          break;

        case 'rich_text':
          result[key] = {
            rich_text: value.rich_text,
            type,
          };
          break;

        case 'number':
          result[key] = {
            number: value.number,
            type,
          };
          break;

        case 'url':
          result[key] = {
            url: value.url,
            type,
          };
          break;

        case 'select':
          result[key] = {
            select: value.select,
            type,
          };
          break;

        case 'multi_select':
          result[key] = {
            multi_select: value.multi_select,
            type,
          };
          break;

        case 'people':
          result[key] = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            people: value.people.map((p: any) => (p.id ? { id: p.id } : p)),
            type,
          };
          break;

        case 'email':
          result[key] = {
            email: value.email,
            type,
          };
          break;

        case 'phone_number':
          result[key] = {
            phone_number: value.phone_number,
            type,
          };
          break;

        case 'date':
          result[key] = {
            date: value.date,
            type,
          };
          break;

        case 'checkbox':
          result[key] = {
            checkbox: value.checkbox,
            type,
          };
          break;

        case 'relation':
          result[key] = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            relation: value.relation.map((r: any) => ({ id: r.id })),
            type,
          };
          break;

        case 'verification':
          result[key] = {
            verification: value.verification,
            type,
          };
          break;

        case 'status':
          result[key] = {
            status: value.status,
            type,
          };
          break;

        case 'formula':
          result[key] = {
            formula: value.formula,
            type,
          };
          break;

        case 'unique_id':
          result[key] = {
            unique_id: value.unique_id,
            type,
          };
          break;

        case 'button':
          result[key] = {
            button: {},
            type,
          };
          break;

        case 'files':
          result[key] = transformFiles(value, type);
          break;

        case 'rollup':
          result[key] = {
            rollup: transformRollup(value.rollup),
            type,
          };
          break;

        case 'created_by':
        case 'created_time':
        case 'last_edited_by':
        case 'last_edited_time':
          continue;

        default:
          break;
      }
    }

    return result;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformFiles(item: any, type: string) {
  return {
    type,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    files: item.files.map((file: any) => {
      if ('file' in file) {
        return {
          file: {
            url: file.file.url,
            expiry_time: file.file.expiry_time,
          },
          name: file.name,
          type: 'file',
        };
      } else {
        return {
          external: {
            url: file.external.url,
          },
          name: file.name,
          type: 'external',
        };
      }
    }),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformRollup(rollup: any) {
  const base = { function: rollup.function };

  switch (rollup.type) {
    case 'number':
      return {
        ...base,
        type: 'number',
        number: rollup.number,
      };
    case 'date':
      return {
        ...base,
        type: 'date',
        date: rollup.date,
      };
    case 'array':
      return {
        ...base,
        type: 'array',
        array: rollup.array.map(transformRollupArrayItem),
      };
    default:
      return rollup;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformRollupArrayItem(item: any) {
  const { type } = item;

  switch (type) {
    case 'number':
      return { type, number: item.number };
    case 'url':
      return { type, url: item.url };
    case 'select':
      return { type, select: item.select };
    case 'multi_select':
      return { type, multi_select: item.multi_select };
    case 'status':
      return { type, status: item.status };
    case 'date':
      return { type, date: item.date };
    case 'email':
      return { type, email: item.email };
    case 'phone_number':
      return { type, phone_number: item.phone_number };
    case 'checkbox':
      return { type, checkbox: item.checkbox };
    case 'files':
      return transformFiles(item, type);
    case 'created_by':
    case 'last_edited_by':
      return { type, [type]: item[type] };
    case 'created_time':
    case 'last_edited_time':
      return { type, [type]: item[type] };
    case 'formula':
      return { type, formula: item.formula };
    case 'button':
      return { type, button: {} };
    case 'unique_id':
      return { type, unique_id: item.unique_id };
    case 'verification':
      return { type, verification: item.verification };
    case 'title':
      return { type, title: item.title };
    case 'rich_text':
      return { type, rich_text: item.rich_text };
    case 'people':
      return {
        type,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        people: item.people.map((p: any) => (p.id ? { id: p.id } : p)),
      };
    case 'relation':
      return {
        type,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        relation: item.relation.map((r: any) => ({ id: r.id })),
      };
    default:
      return item;
  }
}
