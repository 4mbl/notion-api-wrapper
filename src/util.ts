import type { PropOptions } from './api/query.js';
import type {
  SimpleDatabaseProperty,
  VerboseDatabaseProperty,
  SimpleDatabasePage,
} from './naw-types.js';
import type {
  DatabaseObjectResponse,
  QueryDatabaseResponse,
  RichTextItemResponse,
} from './notion-types.js';

export function processQueryData(
  data: QueryDatabaseResponse,
  options?: PropOptions,
) {
  if (options?.remove || options?.keep)
    data = removeProps(data, options) as QueryDatabaseResponse;

  if (options?.simplifyProps) data = simplifyProps(data, options);
  return data;
}

export function removeProps(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  options?: PropOptions,
): QueryDatabaseResponse | DatabaseObjectResponse {
  const removeMetadata: string[] = [];
  const removeProps: string[] = [];

  if (options?.remove?.userIds)
    removeMetadata.push('created_by', 'last_edited_by');
  if (options?.remove?.url) removeMetadata.push('url');
  if (options?.remove?.publicUrl) removeMetadata.push('public_url');
  if (options?.remove?.pageTimestamps)
    removeMetadata.push('created_time', 'last_edited_time');
  if (options?.remove?.objectType) removeMetadata.push('object');
  if (options?.remove?.id) removeMetadata.push('id');
  if (options?.remove?.icon) removeMetadata.push('icon');
  if (options?.remove?.cover) removeMetadata.push('cover');
  if (options?.remove?.archived) removeMetadata.push('archived');
  if (options?.remove?.parent) removeMetadata.push('parent');
  if (options?.remove?.inTrash) removeMetadata.push('in_trash');

  if (options?.keep || options?.remove?.customProps) {
    for (const item of data.results) {
      if (options?.keep && options?.keep?.length > 0) {
        item._properties = item.properties;
        delete item.properties;
        item.properties = {};
        for (const keeper of options.keep) {
          item.properties[keeper] = item._properties[keeper];
        }
        delete item._properties;
      }
      if (options?.remove?.customProps) {
        for (const prop of options.remove.customProps) {
          delete item.properties[prop];
        }
      }
    }
  }

  if (data.object === 'list') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const removeMetadataFromPage = (obj: any) => {
      for (const prop of removeMetadata) delete obj[prop];
      for (const prop of removeProps) delete obj.properties[prop];
      return obj;
    };

    return {
      ...data,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results: data.results.map((page: any) => removeMetadataFromPage(page)),
    };
  } else if (data.object === 'database') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const removeMetadataFromPage = (obj: any) => {
      for (const prop of removeMetadata) delete obj[prop];
      for (const prop of removeProps) delete obj.properties[prop];
      return obj;
    };

    return removeMetadataFromPage(data);
  }

  return data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function simplifyProps(data: any, options?: PropOptions) {
  if (!data) return [];
  if (!options?.simplifyProps && !options?.simpleIcon) return data;
  for (const page of data.results) {
    if (options?.simpleIcon && page.icon) {
      const iconUrl = getIconUrl(page.icon).url;
      if (!iconUrl) return { ...page, icon: null };
      page.icon = iconUrl;
    }

    if (options.simplifyProps && page.properties) {
      for (const prop in page.properties) {
        page[prop] = simplifyProp(page.properties[prop], options);
        delete page.properties[prop];
      }
      if (Object.keys(page.properties).length === 0) delete page.properties;
    }
  }
  return data as SimpleDatabasePage[];
}

function simplifyProp(
  prop: VerboseDatabaseProperty,
  options?: PropOptions,
): SimpleDatabaseProperty {
  switch (prop.type) {
    case 'title':
      return prop.title
        .map((text: RichTextItemResponse) => text.plain_text)
        .join('');
    case 'rich_text':
      return prop.rich_text
        .map((text: RichTextItemResponse) => text.plain_text)
        .join('');
    case 'number':
      return prop.number;
    case 'select':
      return prop.select?.name ?? null;
    case 'multi_select':
      return prop.multi_select?.map((option: { name: string }) => option.name);
    case 'status':
      return prop.status?.name ?? null;
    case 'date':
      return prop.date?.start ?? null;
    case 'people':
      return prop.people?.map((person: { id: string }) => person.id);
    case 'files':
      return prop.files?.map((value) =>
        value.type === 'file'
          ? value.file.url
          : value.type === 'external'
            ? value.external.url
            : null,
      );
    case 'checkbox':
      return prop.checkbox;
    case 'url':
      return prop.url;
    case 'email':
      return prop.email;
    case 'phone_number':
      return prop.phone_number;
    case 'formula':
      if (prop.formula.type === 'string') return prop.formula.string;
      if (prop.formula.type === 'number') return prop.formula.number;
      if (prop.formula.type === 'boolean') return prop.formula.boolean;
      if (prop.formula.type === 'date') return prop.formula.date?.start ?? null;
      return prop.formula;
    case 'relation':
      return prop.relation?.map((relation: { id: string }) => relation.id);
    case 'rollup':
      if (prop.rollup.type === 'array') {
        const rollup = prop.rollup.array;
        const simpleRollup = rollup?.map((item) =>
          simplifyProp({ ...item, id: prop.id }, options),
        );
        const flattenRollup = simpleRollup.flat();
        return flattenRollup;
      } else if (prop.rollup.type === 'date') {
        return prop.rollup.date?.start ?? null;
      } else if (prop.rollup.type === 'number') {
        return prop.rollup.number;
      }
      return prop.rollup;
    case 'created_time':
      return prop.created_time;
    case 'created_by':
      if (options?.remove?.userIds) return null;
      else return prop.created_by.id;
    case 'last_edited_time':
      return prop.last_edited_time;
    case 'last_edited_by':
      if (options?.remove?.userIds) return null;
      else return prop.last_edited_by.id;
    case 'unique_id':
      return prop.unique_id.prefix + '-' + prop.unique_id.number;
    case 'verification':
      return prop.verification?.state as string;

    default:
      return prop.id;
  }
}

function emojiToHex(emoji: string) {
  const codePoints = Array.from(emoji).map((char) => char.codePointAt(0));
  const hexCode = codePoints
    .map((codePoint) => codePoint?.toString(16))
    .join('');

  return hexCode;
}

export function getIconUrl(icon: DatabaseObjectResponse['icon']) {
  let iconUrl: string | undefined = undefined;
  if (icon?.type === 'external') iconUrl = icon?.external?.url;
  else if (icon?.type === 'file') iconUrl = icon?.file?.url;
  else if (icon?.type === 'emoji') {
    iconUrl = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${emojiToHex(
      icon.emoji,
    )}.png`;
  }
  return {
    type: icon?.type,
    url: iconUrl,
  };
}

export function geDatabasetIdFromUrl(url: string) {
  const regex = /\/([^/?]+)\?/;
  const match = url.match(regex);
  return match?.[1] ? match[1] : null;
}
