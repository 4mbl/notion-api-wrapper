import { PropOptions } from './api';

export function removeProps(data: any, options?: PropOptions) {
  let propsToRemove: string[] = [];
  if (options?.removeUserIds)
    propsToRemove.push('created_by', 'last_edited_by');
  if (options?.removeUrl) propsToRemove.push('url');
  if (options?.removePublicUrl) propsToRemove.push('public_url');
  if (options?.removePageTimestamps)
    propsToRemove.push('created_time', 'last_edited_time');
  if (options?.removeObjectType) propsToRemove.push('object');
  if (options?.removeId) propsToRemove.push('id');
  if (options?.removeCover) propsToRemove.push('cover');
  if (options?.removeArchivedStatus) propsToRemove.push('archived');
  if (options?.removeParent) propsToRemove.push('parent');

  if (options?.removeCustomProps) {
    for (const item of data ?? []) {
      for (const prop of options.removeCustomProps ?? []) {
        delete item.properties[prop];
      }
    }
  }

  const removeFromObject = (obj: any) => {
    for (const prop of propsToRemove) delete obj[prop];
    return obj;
  };

  if (Array.isArray(data)) {
    data.forEach((item) => removeFromObject(item));
  } else if (typeof data === 'object') {
    data.results.forEach((item: any) => removeFromObject(item));
  }

  return data;
}

export function simplifyProps(data: any) {
  for (const item of data) {
    if (!item.properties) continue;
    for (const prop in item.properties) {
      if (item.properties[prop].type === 'title') {
        item.title = item.properties[prop].title[0].plain_text;
      } else if (item.properties[prop].type === 'select') {
        item[prop] = item.properties[prop].select?.name;
      } else if (item.properties[prop].type === 'multi_select') {
        item[prop] = item.properties[prop].multi_select?.map(
          (option: any) => option.name
        );
      } else if (item.properties[prop].type === 'formula') {
        item[prop] = item.properties[prop].formula?.string;
      } else if (item.properties[prop].type === 'relation') {
        item[prop] = item.properties[prop].relation?.map(
          (relation: any) => relation.id
        );
      } else if (item.properties[prop].type === 'rollup') {
        item[prop] = item.properties[prop].rollup?.array?.map(
          (relation: any) => relation.id
        );
      } else if (item.properties[prop].type === 'checkbox') {
        item[prop] = item.properties[prop].checkbox;
      } else if (item.properties[prop].type === 'rich_text') {
        item[prop] = item.properties[prop].rich_text[0]?.plain_text;
      } else {
        continue;
      }
      delete item.properties[prop];
      if (Object.keys(item.properties).length === 0) delete item.properties;
    }
  }
  return data;
}