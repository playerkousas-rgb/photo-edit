export interface ColorState {
  foreground: string;
  background: string;
  useGradient: boolean;
  gradientType: 'linear' | 'radial';
  gradientColor1: string;
  gradientColor2: string;
  gradientRotation: number;
}

export interface QRStyleState {
  dotType: 'square' | 'dots' | 'rounded' | 'extra-rounded' | 'classy' | 'classy-rounded';
  eyeFrameType: 'square' | 'dot' | 'extra-rounded';
  eyeDotType: 'square' | 'dot';
  quietZone: number;
}

export interface LogoState {
  image: string | null;
  size: number;
  hideBackgroundDots: boolean;
  margin: number;
}

export interface BarcodeState {
  format: 'CODE128' | 'EAN13' | 'EAN8' | 'UPC' | 'CODE39' | 'ITF14';
  foreground: string;
  background: string;
  width: number;
  height: number;
  displayValue: boolean;
  fontSize: number;
}

export type CodeType = 'qr' | 'barcode';
export type QRTemplate = 'url' | 'wifi' | 'map' | 'vcard' | 'event';

// Template form data
export interface WiFiData {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface MapData {
  query: string;
  lat: string;
  lng: string;
}

export interface VCardData {
  name: string;
  phone: string;
  email: string;
  org: string;
  title: string;
  address: string;
  website: string;
}

export interface EventData {
  title: string;
  url: string;
}

export interface TemplateData {
  wifi: WiFiData;
  map: MapData;
  vcard: VCardData;
  event: EventData;
}

export interface AppState {
  codeType: CodeType;
  qrTemplate: QRTemplate;
  text: string;
  color: ColorState;
  qrStyle: QRStyleState;
  logo: LogoState;
  barcode: BarcodeState;
  templateData: TemplateData;
}
