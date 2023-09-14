import { PropRemoveOptions } from './api';

export function removeProps(data: any, options?: PropRemoveOptions) {
  let propsToRemove: string[] = [];
  if (options?.removeUserIds)
    propsToRemove.push('created_by', 'last_edited_by');
  if (options?.removeUrl) propsToRemove.push('url');
  if (options?.removePublicUrl) propsToRemove.push('public_url');
  if (options?.customProps) propsToRemove.push(...options.customProps);

  const removeFromObject = (obj: any) => {
    for (const prop of propsToRemove) {
      obj[prop] = null;
    }
    return obj;
  };

  if (Array.isArray(data)) {
    data.forEach((item) => removeFromObject(item));
  } else if (typeof data === 'object') {
    data.results.forEach((item: any) => removeFromObject(item));
  }

  return data;
}
