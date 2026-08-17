import type { WiFiData, MapData, VCardData, EventData } from '../types';

export function buildWiFiQR(data: WiFiData): string {
  const { ssid, password, encryption, hidden } = data;
  if (!ssid) return '';
  return `WIFI:T:${encryption};S:${ssid};P:${password};H:${hidden ? 'true' : 'false'};;`;
}

export function buildMapQR(data: MapData): string {
  const { query, lat, lng } = data;
  if (lat && lng) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  if (query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }
  return '';
}

export function buildVCardQR(data: VCardData): string {
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];
  if (data.name) lines.push(`FN:${data.name}`);
  if (data.phone) lines.push(`TEL:${data.phone}`);
  if (data.email) lines.push(`EMAIL:${data.email}`);
  if (data.org) lines.push(`ORG:${data.org}`);
  if (data.title) lines.push(`TITLE:${data.title}`);
  if (data.address) lines.push(`ADR:;;${data.address}`);
  if (data.website) lines.push(`URL:${data.website}`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

export function buildEventQR(data: EventData): string {
  return data.url || '';
}

export function getQRText(template: string, text: string, templateData: { wifi: WiFiData; map: MapData; vcard: VCardData; event: EventData }): string {
  switch (template) {
    case 'wifi':
      return buildWiFiQR(templateData.wifi);
    case 'map':
      return buildMapQR(templateData.map);
    case 'vcard':
      return buildVCardQR(templateData.vcard);
    case 'event':
      return buildEventQR(templateData.event);
    case 'url':
    default:
      return text;
  }
}
