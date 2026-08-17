import type { AppState } from '../types';

export const defaultState: AppState = {
  codeType: 'qr',
  qrTemplate: 'url',
  text: 'https://example.com',
  color: {
    foreground: '#1a1a2e',
    background: '#ffffff',
    useGradient: false,
    gradientType: 'linear',
    gradientColor1: '#e94560',
    gradientColor2: '#0f3460',
    gradientRotation: 0,
  },
  qrStyle: {
    dotType: 'square',
    eyeFrameType: 'square',
    eyeDotType: 'square',
    quietZone: 10,
  },
  logo: {
    image: null,
    size: 0.15,
    hideBackgroundDots: true,
    margin: 0,
  },
  barcode: {
    format: 'CODE128',
    foreground: '#1a1a2e',
    background: '#ffffff',
    width: 2,
    height: 100,
    displayValue: true,
    fontSize: 18,
  },
  templateData: {
    wifi: {
      ssid: '',
      password: '',
      encryption: 'WPA',
      hidden: false,
    },
    map: {
      query: '',
      lat: '',
      lng: '',
    },
    vcard: {
      name: '',
      phone: '',
      email: '',
      org: '',
      title: '',
      address: '',
      website: '',
    },
    event: {
      title: '',
      url: '',
    },
  },
};
