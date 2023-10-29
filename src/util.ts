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
