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
      switch (item.properties[prop].type) {
        case 'title':
          item.title = item.properties[prop].title[0].plain_text;
          break;
        case 'rich_text':
          item[prop] = item.properties[prop].rich_text[0]?.plain_text;
          break;
        case 'number':
          item[prop] = item.properties[prop].number;
          break;
        case 'select':
          item[prop] = item.properties[prop].select?.name;
          break;
        case 'multi_select':
          item[prop] = item.properties[prop].multi_select?.map(
            (option: any) => option.name
          );
          break;
        case 'status':
          item[prop] = item.properties[prop].status.name;
          break;
        case 'date':
          item[prop] = {
            start: item.properties[prop].date?.start,
            end: item.properties[prop].date?.end,
          };
          break;
        case 'people':
          item[prop] = item.properties[prop].people?.map(
            (person: any) => person.id
          );
          break;
        case 'files':
          item[prop] = item.properties[prop].files?.map(
            (file: any) => file.file.url
          );
          break;
        case 'checkbox':
          item[prop] = item.properties[prop].checkbox;
          break;
        case 'url':
          item[prop] = item.properties[prop].url;
          break;
        case 'email':
          item[prop] = item.properties[prop].email;
          break;
        case 'phone_number':
          item[prop] = item.properties[prop].phone_number;
          break;
        case 'formula':
          item[prop] = item.properties[prop].formula?.string;
          break;
        case 'relation':
          item[prop] = item.properties[prop].relation?.map(
            (relation: any) => relation.id
          );
          break;
        case 'rollup':
          item[prop] = item.properties[prop].rollup?.array?.map(
            (relation: any) => relation.id
          );
          break;
        case 'created_time':
          item[prop] = item.properties[prop].created_time;
          break;
        case 'created_by':
          if (options?.removeUserIds) delete item.properties[prop];
          else item[prop] = item.properties[prop].created_by.id;
          break;
        case 'last_edited_time':
          item[prop] = item.properties[prop].last_edited_time;
          break;
        case 'last_edited_by':
          if (options?.removeUserIds) delete item.properties[prop];
          else item[prop] = item.properties[prop].last_edited_by.id;
          break;
        case 'unique_id':
          item[prop] = item.properties[prop].unique_id.prefix + '-';
          item.properties[prop].unique_id.number;
          break;

        default:
          continue;
      }

      delete item.properties[prop];
      if (Object.keys(item.properties).length === 0) delete item.properties;
    }
  }
  return data;
}
