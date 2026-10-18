/**
 * @license
 * Sunshine Brigade Worksheet Builder - Share Link Encoder/Decoder
 * Encodes worksheet JSON into URL hash so users can share without any backend server.
 */

import { Worksheet } from '../types';

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
    const parsed = JSON.parse(jsonStr) as Worksheet;
    if (parsed && Array.isArray(parsed.pages)) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn('Could not decode worksheet from URL hash:', err);
    return null;
  }
}
