// 文化科普相关类型定义

// 结构化的文化科普内容
export interface CultureContent {
  history: string;
  features: string[];
  culture: string;
}

export interface CultureData {
  region: string;
  content: CultureContent | string; // 支持结构化对象或字符串
}

export interface CultureResponse {
  success: boolean;
  data?: CultureData;
  error?: string;
}

// 文化科普状态
export type CultureStatus = 'idle' | 'loading' | 'loaded' | 'error';

// 文化科普卡片配置
export interface CultureCardConfig {
  showHistory: boolean;
  showFeatures: boolean;
  showCulture: boolean;
  expandable: boolean;
  maxHeight?: number;
}

// 地区信息
export interface RegionInfo {
  name: string;
  displayName: string;
  description?: string;
  aliases?: string[];
}

// 常见方言地区
export const COMMON_DIALECT_REGIONS: RegionInfo[] = [
  {
    name: '山东',
    displayName: '山东话',
    description: '齐鲁大地的方言，豪爽直率',
    aliases: ['山东话', '鲁语']
  },
  {
    name: '四川',
    displayName: '四川话',
    description: '巴蜀文化的语言载体，生动有趣',
    aliases: ['四川话', '川话', '巴蜀话']
  },
  {
    name: '广东',
    displayName: '粤语',
    description: '岭南文化的重要组成部分',
    aliases: ['粤语', '广东话', '白话']
  },
  {
    name: '上海',
    displayName: '上海话',
    description: '吴语的代表，海派文化的体现',
    aliases: ['上海话', '沪语']
  },
  {
    name: '北京',
    displayName: '北京话',
    description: '京腔京韵，皇城文化的传承',
    aliases: ['北京话', '京话']
  },
  {
    name: '东北',
    displayName: '东北话',
    description: '豪放幽默，东北文化的特色',
    aliases: ['东北话', '东北方言']
  },
  {
    name: '湖南',
    displayName: '湖南话',
    description: '湘楚文化的语言表达',
    aliases: ['湖南话', '湘语']
  },
  {
    name: '福建',
    displayName: '闽南话',
    description: '闽南文化的重要载体',
    aliases: ['闽南话', '福建话', '台语']
  },
  {
    name: '河南',
    displayName: '河南话',
    description: '中原文化的语言根基',
    aliases: ['河南话', '中原官话']
  },
  {
    name: '陕西',
    displayName: '陕西话',
    description: '三秦大地的方言特色',
    aliases: ['陕西话', '关中话']
  }
];

// 获取地区信息
export function getRegionInfo(regionName: string): RegionInfo | undefined {
  return COMMON_DIALECT_REGIONS.find(
    region => 
      region.name === regionName || 
      region.displayName === regionName ||
      region.aliases?.includes(regionName)
  );
}

// 格式化地区名称
export function formatRegionName(regionName: string): string {
  const regionInfo = getRegionInfo(regionName);
  return regionInfo?.displayName || regionName;
}