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

  return simplifyProps(data, options);
}

export function simplifyProps(data: any, options?: PropOptions) {
  for (const item of data) {
    if (!item.properties) continue;
    for (const prop in item.properties) {
      item[prop] = simplifyProp(item.properties[prop], options);
      delete item.properties[prop];
      if (Object.keys(item.properties).length === 0) delete item.properties;
    }
  }
  return data;
}

function simplifyProp(prop: any, options?: PropOptions) {
  switch (prop.type) {
    case 'title':
      return prop.title[0].plain_text;
    case 'rich_text':
      return prop.rich_text[0]?.plain_text;
    case 'number':
      return prop.number;
    case 'select':
      return prop.select?.name;
    case 'multi_select':
      return prop.multi_select?.map((option: any) => option.name);
    case 'status':
      return prop.status.name;
    case 'date':
      return {
        start: prop.date?.start,
        end: prop.date?.end,
      };
    case 'people':
      return prop.people?.map((person: any) => person.id);
    case 'files':
      return prop.files?.map((file: any) => file.file.url);
    case 'checkbox':
      return prop.checkbox;
    case 'url':
      return prop.url;
    case 'email':
      return prop.email;
    case 'phone_number':
      return prop.phone_number;
    case 'formula':
      return prop.formula?.string;
    case 'relation':
      return prop.relation?.map((relation: any) => relation.id);
    case 'rollup':
      const rollups = prop.rollup?.array?.map((item: any) =>
        simplifyProp(item, options)
      );
      return rollups.flat(Infinity);
    case 'created_time':
      return prop.created_time;
    case 'created_by':
      if (options?.removeUserIds) return null;
      else return prop.created_by.id;
    case 'last_edited_time':
      return prop.last_edited_time;
    case 'last_edited_by':
      if (options?.removeUserIds) return null;
      else return prop.last_edited_by.id;
    case 'unique_id':
      return prop.unique_id.prefix + '-' + prop.unique_id.number;

    default:
      return prop;
  }
}
