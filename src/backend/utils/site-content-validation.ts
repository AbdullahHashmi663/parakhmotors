import { defaultSiteContent, packageIds, type SiteContent } from '@/lib/site-content';
import { ApiError } from './api-error';

type JsonObject = Record<string, unknown>;
const serviceRoutes = new Set(['/', '/client/services', '/client/inspection', '/client/sell-my-car', '/client/car-finding', '/client/about', '/client/contact', '/client/investor', '/client/privacy-policy']);

function objectValue(value: unknown, path: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw ApiError.badRequest(`${path} must be an object`);
  return value as JsonObject;
}

function safeUrl(value: string, path: string, image: boolean) {
  if (!value) return;
  if (image && value.startsWith('/') && !value.startsWith('//') && !/[\\\s]/.test(value) && !/%(?:2f|5c|2e)/i.test(value) && !value.includes('..') && /^\/(?:images|brand)\/[^?#]+\.(?:webp|png|jpe?g|avif|gif)(?:\?[^#]*)?$/i.test(value)) return;
  try {
    if (!/^https:\/\//i.test(value) || /[\\\s]/.test(value)) throw new Error('Invalid URL');
    const address = new URL(value);
    if (address.protocol !== 'https:' || address.username || address.password || address.port) throw new Error('Invalid URL');
    if (image && address.hostname !== 'images.unsplash.com') throw new Error('Unsupported image host');
  } catch {
    throw ApiError.badRequest(image ? `${path} must be a local image or an https://images.unsplash.com image` : `${path} must be a valid HTTPS URL`);
  }
}

function validateValue(value: unknown, sample: unknown, path: string, key = ''): unknown {
  if (typeof sample === 'string') {
    if (typeof value !== 'string') throw ApiError.badRequest(`${path} must be text`);
    const clean = value.trim();
    const max = /description|answer|paragraph|body|copy|statement/i.test(key) ? 6000 : 1000;
    if (clean.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(clean)) throw ApiError.badRequest(`${path} must contain valid text of at most ${max} characters`);
    if ((key === 'id' || key === 'kind') && !clean.length) throw ApiError.badRequest(`${path} cannot be empty`);
    if (key === 'id' && !/^[a-zA-Z0-9_-]{1,120}$/.test(clean)) throw ApiError.badRequest(`${path} contains an invalid ID`);
    if (key === 'href' && !serviceRoutes.has(clean)) throw ApiError.badRequest(`${path} must point to an existing website page`);
    if (/url$/i.test(key)) safeUrl(clean, path, false);
    if (/(^image$|Image$)/.test(key)) safeUrl(clean, path, true);
    return clean;
  }
  if (typeof sample === 'number') {
    const maximum = key === 'price' ? 1000000000 : 10000000000;
    if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 0 || value > maximum) throw ApiError.badRequest(`${path} must be a whole number between 0 and ${maximum.toLocaleString('en-US')}`);
    return value;
  }
  if (typeof sample === 'boolean') {
    if (typeof value !== 'boolean') throw ApiError.badRequest(`${path} must be true or false`);
    return value;
  }
  if (Array.isArray(sample)) {
    if (!Array.isArray(value) || value.length > 30) throw ApiError.badRequest(`${path} must be a list with at most 30 items`);
    const first = sample[0] ?? (key === 'faq' ? { question: '', answer: '' } : key === 'steps' || key === 'rows' ? { title: '', description: '' } : '');
    const fixedRecords = key === 'packages';
    if (fixedRecords) {
      const expected = new Map(sample.map((item: JsonObject) => [item.id, item]));
      if (value.length !== expected.size) throw ApiError.badRequest(`${path} must contain each supported item exactly once`);
      const used = new Set<unknown>();
      return value.map((item, index) => {
        const record = objectValue(item, `${path}[${index}]`);
        if (!expected.has(record.id) || used.has(record.id)) throw ApiError.badRequest(`${path} contains an unknown or duplicate item ID`);
        used.add(record.id);
        return validateValue(record, expected.get(record.id), `${path}[${index}]`);
      });
    }
    return value.map((item, index) => validateValue(item, first, `${path}[${index}]`, key));
  }
  const template = objectValue(sample, path);
  const record = objectValue(value, path);
  if (Object.keys(record).some((name) => !Object.hasOwn(template, name))) throw ApiError.badRequest(`${path} contains an unsupported field`);
  const result: JsonObject = {};
  for (const [name, field] of Object.entries(template)) {
    if (!Object.hasOwn(record, name)) throw ApiError.badRequest(`${path}.${name} is required`);
    result[name] = validateValue(record[name], field, `${path}.${name}`, name);
  }
  return result;
}

/** Validate the full editor document before defaults can conceal malformed input. */
export function validateSiteContent(value: unknown): SiteContent {
  const content = validateValue(value, defaultSiteContent, 'websiteContent') as SiteContent;
  for (const item of content.packages) {
    const expected = defaultSiteContent.packages.find((entry) => entry.id === item.id);
    if (!expected || expected.kind !== item.kind) throw ApiError.badRequest(`Invalid service kind for package ${item.id}`);
    if (item.discountPrice !== 0 && item.discountPrice >= item.price) throw ApiError.badRequest(`The discount price for ${item.title} must be lower than its regular price`);
  }
  for (const offering of content.services) {
    if (new Set(offering.packageIds).size !== offering.packageIds.length || offering.packageIds.some((id) => !packageIds.includes(id))) throw ApiError.badRequest(`Invalid package selection for ${offering.title || offering.id}`);
  }
  if (new Set(content.services.map((offering) => offering.id)).size !== content.services.length) throw ApiError.badRequest('Service IDs must be unique');
  if (content.sourcing.minimumBudget < 1 || content.sourcing.highBudgetThreshold < content.sourcing.minimumBudget) throw ApiError.badRequest('The higher budget threshold must be at least the minimum sourcing budget');
  return content;
}
