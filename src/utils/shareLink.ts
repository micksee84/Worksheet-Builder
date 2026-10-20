/**
 * @license
 * Sunshine Brigade Worksheet Builder - Share Link Encoder/Decoder
 * Encodes worksheet JSON into URL hash so users can share without any backend server.
 * Incoming links are validated before use, and the hash is removed from the address bar
 * once read, so a later refresh loads the parent's latest saved work, not the old link.
 */

import { Worksheet } from '../types';
import { validateWorksheet } from './validateWorksheet';

export function encodeWorksheetToHash(worksheet: Worksheet): string {
  try {
    const jsonStr = JSON.stringify(worksheet);
    // Safe UTF-8 to Base64
    const base64 = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
    return `#ws=${encodeURIComponent(base64)}`;
  } catch (err) {
    console.error('Error encoding worksheet to URL:', err);
    return '';
  }
}

/** Builds the full shareable URL without touching the current address bar. */
export function buildShareUrl(worksheet: Worksheet): string {
  const hash = encodeWorksheetToHash(worksheet);
  if (typeof window === 'undefined' || !hash) return '';
  return `${window.location.origin}${window.location.pathname}${hash}`;
}

/** Removes a #ws= share hash from the address bar without reloading. */
export function clearShareHash(): void {
  try {
    if (typeof window === 'undefined') return;
    if (!window.location.hash.startsWith('#ws=')) return;
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  } catch (err) {
    console.warn('Could not clear share link from URL:', err);
  }
}

export function decodeWorksheetFromHash(): Worksheet | null {
  try {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash;
    if (!hash) return null;

    const match = hash.match(/#ws=([^&]+)/);
    if (!match || !match[1]) return null;

    const base64 = decodeURIComponent(match[1]);
    const jsonStr = decodeURIComponent(
      Array.prototype.map
        .call(atob(base64), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return validateWorksheet(JSON.parse(jsonStr));
  } catch (err) {
    console.warn('Could not decode worksheet from URL hash:', err);
    return null;
  }
}
