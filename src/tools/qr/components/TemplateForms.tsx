import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi, MapPin, Contact, Calendar, Link2, Eye, EyeOff, Lock } from 'lucide-react';
import type { AppState, QRTemplate, WiFiData, MapData, VCardData, EventData } from '../types';

interface TemplateFormsProps {
  state: AppState;
  onChange: (state: AppState) => void;
}

const TEMPLATES: { value: QRTemplate; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'url', label: '網址', icon: <Link2 className="w-4 h-4" />, desc: '一般網址或文字' },
  { value: 'wifi', label: 'Wi-Fi', icon: <Wifi className="w-4 h-4" />, desc: '掃描即連 Wi-Fi' },
  { value: 'map', label: '地圖', icon: <MapPin className="w-4 h-4" />, desc: 'Google Maps 定位' },
  { value: 'vcard', label: '聯絡人', icon: <Contact className="w-4 h-4" />, desc: 'vCard 名片' },
  { value: 'event', label: '活動', icon: <Calendar className="w-4 h-4" />, desc: '報名連結' },
];

export function TemplateSelector({ state, onChange }: TemplateFormsProps) {
  const handleTemplateChange = (template: string) => {
    onChange({ ...state, qrTemplate: template as QRTemplate });
  };

  return (
    <div className="grid grid-cols-5 gap-1.5">
      {TEMPLATES.map((t) => (
        <button
          key={t.value}
          onClick={() => handleTemplateChange(t.value)}
          className={`flex flex-col items-center gap-1 px-1.5 py-2 rounded-lg border transition-all ${
            state.qrTemplate === t.value
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              : 'bg-slate-800/30 border-slate-700/30 text-slate-400 hover:border-slate-600 hover:text-slate-300'
          }`}
        >
          {t.icon}
          <span className="text-[10px] font-medium">{t.label}</span>
        </button>
      ))}
    </div>
  );
}

export function WiFiForm({ state, onChange }: TemplateFormsProps) {
  const data = state.templateData.wifi;
  const update = (partial: Partial<WiFiData>) => {
    onChange({
      ...state,
      templateData: {
        ...state.templateData,
        wifi: { ...data, ...partial },
      },
    });
  };

  const [showPassword, setShowPassword] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Wi-Fi 名稱 (SSID)</label>
        <input
          type="text"
          value={data.ssid}
          onChange={(e) => update({ ssid: e.target.value })}
          placeholder="MyWiFi"
          className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50 transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">密碼</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={data.password}
            onChange={(e) => update({ password: e.target.value })}
            placeholder="password123"
            className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 pr-10 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50 transition-all"
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">加密方式</label>
          <select
            value={data.encryption}
            onChange={(e) => update({ encryption: e.target.value as WiFiData['encryption'] })}
            className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500/50 transition-all appearance-none"
          >
            <option value="WPA">WPA/WPA2</option>
            <option value="WEP">WEP</option>
            <option value="nopass">無密碼</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => update({ hidden: !data.hidden })}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all w-full ${
              data.hidden
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:border-slate-600'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            {data.hidden ? '隱藏網路' : '公開網路'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function MapForm({ state, onChange }: TemplateFormsProps) {
  const data = state.templateData.map;
  const update = (partial: Partial<MapData>) => {
    onChange({
      ...state,
      templateData: {
        ...state.templateData,
        map: { ...data, ...partial },
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">地點名稱 / 地址</label>
        <input
          type="text"
          value={data.query}
          onChange={(e) => update({ query: e.target.value })}
          placeholder="台北101"
          className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50 transition-all"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-slate-700/40" />
        <span className="text-[10px] text-slate-500">或輸入座標</span>
        <div className="h-px flex-1 bg-slate-700/40" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">緯度 (Lat)</label>
          <input
            type="text"
            value={data.lat}
            onChange={(e) => update({ lat: e.target.value })}
            placeholder="25.0330"
            className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">經度 (Lng)</label>
          <input
            type="text"
            value={data.lng}
            onChange={(e) => update({ lng: e.target.value })}
            placeholder="121.5654"
            className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50 transition-all"
          />
        </div>
      </div>
    </motion.div>
  );
}

export function VCardForm({ state, onChange }: TemplateFormsProps) {
  const data = state.templateData.vcard;
  const update = (partial: Partial<VCardData>) => {
    onChange({
      ...state,
      templateData: {
        ...state.templateData,
        vcard: { ...data, ...partial },
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">姓名 *</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="王小明"
            className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">電話</label>
          <input
            type="text"
            value={data.phone}
            onChange={(e) => update({ phone: e.target.value })}
            placeholder="+886 912 345 678"
            className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50 transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">電子郵件</label>
        <input
          type="text"
          value={data.email}
          onChange={(e) => update({ email: e.target.value })}
          placeholder="name@example.com"
          className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50 transition-all"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">公司 / 組織</label>
          <input
            type="text"
            value={data.org}
            onChange={(e) => update({ org: e.target.value })}
            placeholder="旅行社名稱"
            className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">職稱</label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="領隊"
            className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50 transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">地址</label>
        <input
          type="text"
          value={data.address}
          onChange={(e) => update({ address: e.target.value })}
          placeholder="台北市信義區..."
          className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50 transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">網站</label>
        <input
          type="text"
          value={data.website}
          onChange={(e) => update({ website: e.target.value })}
          placeholder="https://example.com"
          className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50 transition-all"
        />
      </div>
    </motion.div>
  );
}

export function EventForm({ state, onChange }: TemplateFormsProps) {
  const data = state.templateData.event;
  const update = (partial: Partial<EventData>) => {
    onChange({
      ...state,
      templateData: {
        ...state.templateData,
        event: { ...data, ...partial },
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">活動名稱</label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="春季旅遊團"
          className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50 transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">報名連結 (Google Form / 網址)</label>
        <input
          type="text"
          value={data.url}
          onChange={(e) => update({ url: e.target.value })}
          placeholder="https://forms.google.com/..."
          className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50 transition-all"
        />
      </div>

      <div className="flex items-start gap-1.5 text-[10px] text-slate-400 bg-slate-800/40 rounded-md px-2 py-1.5">
        <span>💡 掃描後將直接開啟報名頁面，建議使用短網址以減少 QR Code 密度</span>
      </div>
    </motion.div>
  );
}
