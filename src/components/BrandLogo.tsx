import React, { useState } from 'react';
import { matchLogoHubBank } from '../lib/logohubData';

export interface BrandLogoProps {
  type: string;
  logoUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * 官方标准级银行与金融机构正版矢量LOGO
 * 优先调用 https://logohub.afengblog.com/ 官方正版矢量库数据
 * 内置高保真离线矢量兜底
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  type,
  logoUrl,
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const sizeMap = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-7.5 h-7.5',
    lg: 'w-9.5 h-9.5',
    xl: 'w-12 h-12',
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const brandKey = (type || '').toLowerCase().trim();

  // 🏦 优先使用来源于 https://logohub.afengblog.com/ 的正版矢量 SVG
  const yuebaoOfficialUrl = 'https://logohub.afengblog.com/logos/library/svglogo/pay/yuebao.svg';
  const mybankOfficialUrl = 'https://logohub.afengblog.com/logos/library/svglogo/pay/Mybank.svg';
  const huabeiOfficialUrl = 'https://logohub.afengblog.com/logos/library/svglogo/pay/huabei.svg';
  const baitiaoOfficialUrl =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23EC4899"/><text x="50" y="63" fill="%23FFFFFF" font-size="34" font-weight="900" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" letter-spacing="-1">白条</text></svg>';

  const resolveLogoUrl = () => {
    if (brandKey === 'baitiao' || brandKey === 'jd_baitiao') return baitiaoOfficialUrl;
    if (brandKey === 'yuebao' || brandKey === 'yuebaobao') return yuebaoOfficialUrl;
    if (brandKey === 'mybank') return mybankOfficialUrl;
    if (brandKey === 'huabei') return huabeiOfficialUrl;
    if (logoUrl) return logoUrl;
    return matchLogoHubBank(type)?.logoUrl || null;
  };

  const effectiveLogoUrl = !imgError ? resolveLogoUrl() : null;
  if (effectiveLogoUrl) {
    return (
      <div
        className={`${currentSize} max-w-[35px] max-h-[35px] aspect-square rounded-full bg-white flex items-center justify-center p-0.5 shadow-2xs shrink-0 select-none overflow-hidden border border-slate-100/90 ${className}`}
        title={type || '银行徽标'}
      >
        <img
          src={effectiveLogoUrl}
          alt={type || 'Bank Logo'}
          className="w-full h-full max-w-[35px] max-h-[35px] object-contain p-0.5 pointer-events-none select-none transition-transform"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  switch (brandKey) {
    // 1. 招商银行 (CMB) - 招商银行经典C-M-B飞帆标
    case 'cmb':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#E11922] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="招商银行 China Merchants Bank"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
            {/* 招行标志性外圈C形环弧 */}
            <path
              d="M 79 25 A 39 39 0 1 0 79 75"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* 招行稳健M字双峰造型 */}
            <path
              d="M 27 68 L 38 30 L 50 48 L 62 30 L 73 68"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* 基底横线（与M结合构成B字寓意） */}
            <line
              x1="20"
              y1="70"
              x2="80"
              y2="70"
              stroke="#FFFFFF"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* 底部速度平行射线 */}
            <line
              x1="32"
              y1="80"
              x2="68"
              y2="80"
              stroke="#FFFFFF"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );

    // 2. 中国工商银行 (ICBC) - 工字方圆古钱标
    case 'icbc':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#C7000B] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="中国工商银行 ICBC"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <path d="M50 8C26.8 8 8 26.8 8 50s18.8 42 42 42 42-18.8 42-42S73.2 8 50 8zm0 8c18.78 0 34 15.22 34 34S68.78 84 50 84 16 68.78 16 50s15.22-34 34-34zm-22 17v8h44v-8H28zm14 13v12h16V46H42zm-14 17v8h44v-8H28z" />
          </svg>
        </div>
      );

    // 3. 中国建设银行 (CCB) - 双C飞白龙鼎标
    case 'ccb':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#0054A6] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="中国建设银行 CCB"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <path d="M50 25c-13.8 0-25 11.2-25 25s11.2 25 25 25c9.2 0 17.2-5 21.5-12.3l-7.7-3.8C60.4 63.8 55.6 67 50 67c-9.4 0-17-7.6-17-17s7.6-17 17-17c5.6 0 10.4 3.2 13.8 8.1l7.7-3.8C67.2 30 59.2 25 50 25z" />
          </svg>
        </div>
      );

    // 4. 中国农业银行 (ABC) - 麦穗铜钱标
    case 'abc':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#00897B] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="中国农业银行 ABC"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full stroke-white fill-none stroke-[7]" strokeLinecap="round">
            <circle cx="50" cy="50" r="41" strokeWidth="8" />
            <line x1="50" y1="20" x2="50" y2="80" strokeWidth="8" />
            <path d="M35 35 L50 20 L65 35" strokeWidth="7" />
            <path d="M30 50 L50 35 L70 50" strokeWidth="7" />
            <path d="M26 65 L50 50 L74 65" strokeWidth="7" />
          </svg>
        </div>
      );

    // 5. 中国银行 (BOC) - 天圆地方古钱标
    case 'boc':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#B20015] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="中国银行 Bank of China"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <rect x="36" y="36" width="28" height="28" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <line x1="50" y1="8" x2="50" y2="36" stroke="#FFFFFF" strokeWidth="9" />
            <line x1="50" y1="64" x2="50" y2="92" stroke="#FFFFFF" strokeWidth="9" />
          </svg>
        </div>
      );

    // 6. 交通银行 (BOCOM) - 经典立体交标
    case 'bocom':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#002B66] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="交通银行 BOCOM"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <path d="M50 12 L14 36 L14 84 L86 84 L86 36 Z M50 28 L72 44 L72 72 L28 72 L28 44 Z M38 52 L62 52 L62 62 L38 62 Z" />
          </svg>
        </div>
      );

    // 7. 中国邮政储蓄银行 (PSBC) - 绿色经典邮雁标
    case 'psbc':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#007A3D] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="中国邮政储蓄银行 PSBC"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <path d="M22 34 L78 34 L50 56 Z M20 40 L48 62 L20 74 Z M80 40 L52 62 L80 74 Z M26 76 L74 76 L50 65 Z" />
          </svg>
        </div>
      );

    // 8. 中信银行 (CITIC) - 红色方印双窗标
    case 'citic':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#DB0011] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="中信银行 China CITIC Bank"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <rect x="18" y="18" width="64" height="64" rx="8" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <rect x="32" y="32" width="16" height="36" rx="2" fill="#FFFFFF" />
            <rect x="52" y="32" width="16" height="36" rx="2" fill="#FFFFFF" />
          </svg>
        </div>
      );

    // 9. 中国光大银行 (CEB) - 紫色光芒S纽带标
    case 'ceb':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#671E75] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="中国光大银行 China Everbright Bank"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <path d="M35 34 C35 26 44 22 53 22 C64 22 70 28 68 36 C66 44 50 46 44 52 C38 58 40 68 50 68 C58 68 64 64 66 58 L74 62 C70 72 61 78 49 78 C35 78 28 68 32 56 C35 46 50 43 56 38 C60 34 58 30 52 30 C46 30 43 33 42 37 Z" />
          </svg>
        </div>
      );

    // 10. 华夏银行 (HXB) - 红色玉龙玉佩C形标
    case 'hxb':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#CD0000] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="华夏银行 Hua Xia Bank"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <path d="M50 15 C70 15 85 30 85 50 C85 70 70 85 50 85 C30 85 15 70 15 50 C15 30 30 15 50 15 Z M50 27 C37 27 27 37 27 50 C27 63 37 73 50 73 C60 73 68 66 71 58 L81 64 C76 77 64 85 50 85" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <circle cx="50" cy="50" r="10" fill="#FFFFFF" />
          </svg>
        </div>
      );

    // 11. 中国民生银行 (CMBC) - 蓝绿渐变民生帆标
    case 'cmbc':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#007078] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="中国民生银行 CMBC"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <path d="M16 80 L50 20 L84 80 L62 80 L50 56 L38 80 Z M50 38 L58 54 L42 54 Z" />
          </svg>
        </div>
      );

    // 12. 广发银行 (CGB) - 红色现代折角标
    case 'cgb':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#C60000] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="广发银行 China Guangfa Bank"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <polygon points="50,15 85,35 85,65 50,85 15,65 15,35" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <polygon points="50,28 72,42 72,60 50,72 28,60 28,42" fill="#FFFFFF" />
          </svg>
        </div>
      );

    // 13. 平安银行 (PINGAN / PAB) - 橙红相间平安方印标
    case 'pingan':
    case 'pab':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#EA5404] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="平安银行 Ping An Bank"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <rect x="18" y="18" width="64" height="64" rx="14" fill="#FFFFFF" />
            <rect x="25" y="25" width="22" height="22" rx="4" fill="#EA5404" />
            <rect x="53" y="25" width="22" height="22" rx="4" fill="#EA5404" />
            <rect x="25" y="53" width="22" height="22" rx="4" fill="#EA5404" />
            <circle cx="64" cy="64" r="11" fill="#EA5404" />
          </svg>
        </div>
      );

    // 14. 浦发银行 (SPDB) - 蓝色极简SPD聚合标
    case 'spdb':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#0C326E] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="浦发银行 SPDB"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <path d="M30 35 L48 35 C58 35 64 41 64 50 C64 59 58 65 48 65 L30 65 Z M42 45 L42 55 L48 55 C52 55 54 53 54 50 C54 47 52 45 48 45 Z" />
          </svg>
        </div>
      );

    // 15. 兴业银行 (CIB) - 科技深蓝太极环标
    case 'cib':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#004A97] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="兴业银行 Industrial Bank"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <path d="M50 18 A32 32 0 0 1 82 50 A16 16 0 0 1 50 50 A16 16 0 0 0 18 50 A32 32 0 0 1 50 18 Z" fill="#FFFFFF" />
            <circle cx="50" cy="34" r="5" fill="#004A97" />
            <circle cx="50" cy="66" r="5" fill="#FFFFFF" />
          </svg>
        </div>
      );

    // 16. 浙商银行 (CZB) - 红色正方鼎标
    case 'czb':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#C9151E] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="浙商银行 China Zheshang Bank"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <rect x="20" y="20" width="60" height="60" rx="10" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <path d="M34 36 L66 36 L44 64 L66 64" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );

    // 17. 宁波银行 (NBCB) - 温暖金橙汇通标
    case 'nbcb':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#F58220] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="宁波银行 Bank of Ningbo"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <path d="M28 70 L28 30 L45 56 L45 30 M55 70 L55 30 L72 56 L72 30" fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" />
          </svg>
        </div>
      );

    // 18. 北京银行 (BOB) - 经典京韵红标
    case 'bob':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#C8102E] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="北京银行 Bank of Beijing"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <rect x="34" y="30" width="32" height="40" rx="4" fill="none" stroke="#FFFFFF" strokeWidth="7" />
            <line x1="34" y1="50" x2="66" y2="50" stroke="#FFFFFF" strokeWidth="7" />
          </svg>
        </div>
      );

    // 19. 上海银行 (BOS) - 经典海韵蓝标
    case 'bos':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#004B97] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="上海银行 Bank of Shanghai"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#FFFFFF" strokeWidth="8" />
            <path d="M28 50 C28 35 40 28 50 28 C62 28 72 36 72 48 C72 62 58 64 50 68 C44 71 38 74 38 80 L72 80" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
          </svg>
        </div>
      );

    // 20. 江苏银行 (JSB) - 金辉融汇J标
    case 'jsb':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#D4AF37] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="江苏银行 Bank of Jiangsu"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-[#1A1A1A]" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="#D4AF37" />
            <path d="M56 25 L56 60 C56 68 50 74 40 74 C32 74 26 68 26 60 L36 60 C36 63 38 66 41 66 C44 66 46 64 46 60 L46 25 Z" fill="#1A1A1A" />
          </svg>
        </div>
      );

    // 21. 汇丰银行 (HSBC) - 经典六角红白菱形标
    case 'hsbc':
      return (
        <div
          className={`${currentSize} rounded-full bg-white flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden border border-slate-100 ${className}`}
          title="汇丰银行 HSBC"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
            <polygon points="50,15 85,50 50,85 15,50" fill="#DB0011" />
            <polygon points="50,15 15,50 15,15" fill="#DB0011" />
            <polygon points="50,85 85,50 85,85" fill="#DB0011" />
            <polygon points="50,15 85,15 85,50" fill="#FFFFFF" />
            <polygon points="15,50 15,85 50,85" fill="#FFFFFF" />
          </svg>
        </div>
      );

    // 22. 渣打银行 (SCB) - 经典双螺旋蓝绿标
    case 'scb':
      return (
        <div
          className={`${currentSize} rounded-full bg-white flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden border border-slate-100 ${className}`}
          title="渣打银行 Standard Chartered"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
            <path d="M30 20 C18 32 18 52 30 64 L50 84 C62 72 62 52 50 40 Z" fill="#0072CE" />
            <path d="M70 20 C82 32 82 52 70 64 L50 84 C38 72 38 52 50 40 Z" fill="#00A54F" />
          </svg>
        </div>
      );

    // 23. 花旗银行 (CITI) - 经典红蓝弧拱标
    case 'citi':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#003B70] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="花旗银行 Citibank"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
            <path d="M35 30 C50 15 65 15 80 30" fill="none" stroke="#ED1B2D" strokeWidth="8" strokeLinecap="round" />
            <text x="50" y="68" fill="#FFFFFF" fontSize="30" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">citi</text>
          </svg>
        </div>
      );

    // 24. 浙江网商银行 (MYBANK) - 阿里蚂蚁互联网银行官方双色M标
    case 'mybank':
      return (
        <div
          className={`${currentSize} rounded-full bg-white flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden border border-slate-100 ${className}`}
          title="网商银行 MYbank"
        >
          <svg viewBox="0 0 60 60" fill="none" className="w-full h-full scale-[0.9]" aria-hidden="true">
            <path d="M7.555 54.67a5.55 5.55 0 0 1-3.926-1.626A5.57 5.57 0 0 1 2 49.117V11.563c0-1.476.585-2.891 1.627-3.934A5.55 5.55 0 0 1 7.555 6h7.48a6.9 6.9 0 0 1 3.997 1.268l11.394 9.362-9.647 8.17a2.3 2.3 0 0 1-3.026 0l-2.849-2.505a2.302 2.302 0 0 0-3.583 1.268 2.3 2.3 0 0 0-.082.609c-.002.596.2 1.174.573 1.639l10.806 14.314A7.8 7.8 0 0 1 24.2 44.88v7.022a2.78 2.78 0 0 1-1.713 2.569c-.337.14-.698.212-1.062.212H7.554" fill="#1677ff" />
            <path d="M33.917 34.136c-.633.539-1.392 1.065-2.459 1.065a3.88 3.88 0 0 1-2.532-1.065l-8.77-7.418a4.3 4.3 0 0 0 1.984-.98l1.266-1.148L43.742 7.788A6.9 6.9 0 0 1 48.395 6h3.586a5.55 5.55 0 0 1 3.928 1.63 5.57 5.57 0 0 1 1.627 3.934v37.552h-.023a5.57 5.57 0 0 1-1.625 3.932 5.55 5.55 0 0 1-3.926 1.628H38.098a2.77 2.77 0 0 1-2.567-1.715c-.14-.338-.212-.7-.212-1.065V44.34a7.84 7.84 0 0 1 1.498-4.622l8.498-9.33a2.313 2.313 0 0 0-1.466-3.902 2.3 2.3 0 0 0-1.62.481h.016z" fill="#00b6ff" />
          </svg>
        </div>
      );

    // 25. 微众银行 (WEBANK) - 腾讯数字银行官方标
    case 'webank':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#0052D9] flex items-center justify-center p-0.5 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="微众银行 WeBank"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <text x="50" y="38" fill="#FFFFFF" fontSize="16" fontWeight="800" fontFamily="sans-serif" textAnchor="middle">WeBank</text>
            <path d="M28 48 A 10 10 0 0 1 38 58 A 10 10 0 0 1 28 68" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
            <path d="M72 48 A 10 10 0 0 0 62 58 A 10 10 0 0 0 72 68" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
            <path d="M32 72 Q 50 86 68 72" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
          </svg>
        </div>
      );

    // 26. 百信银行 (AIBANK) - 百度中信AI银行
    case 'aibank':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#E11922] flex items-center justify-center p-0.5 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="百信银行 aiBank"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
            <text x="48" y="62" fill="#FFFFFF" fontSize="22" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" textAnchor="middle" letterSpacing="-0.5">aiBank</text>
            <circle cx="33" cy="45" r="3.5" fill="#FFD200" />
          </svg>
        </div>
      );

    // 27. 支付宝 (ALIPAY) - 官方正版矢量标
    case 'alipay':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#1677FF] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="支付宝 Alipay"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white scale-[0.88]" aria-hidden="true">
            <path d="M79.52 23.82h-24.48v-11.47c0-.37-.3-.67-.66-.67-9.94 0-12.11 2.45-12.11 5.65v6.5h-23.23c-1.39 0-1.99 3.21-1.99 5.48 0 .37.29.68.66.69h24.56v8.13h-16.28c-1.39 0-2 3.31-1.99 5.5 0 .37.3.66.66.66h32.69c-.58 5.38-2.1 10.62-4.48 15.48 4.01 1.89 8.03 3.92 12.26 5.8 4.94-7.94 7.95-17.03 8.01-26.1 0-.74-.59-1.34-1.32-1.34h-16.75v-8.13h23.16c1.39 0 1.99-3.08 1.99-5.48 0-.37-.29-.68-.66-.69z" />
            <path d="M24.26 60.65c7.91 0 15.49 3.36 22.86 7.74 3.51 2.09 6.97 4.4 10.41 6.7 9.77 6.54 19.23 12.9 28.68 13.22-15.18-.55-20.71-17.71-33.36-28.55-8.41-3.96-16.81-7.32-27.13-7.32-12.17 0-20.73 7.92-20.73 17.99s8.75 17.9 20.73 17.9c8.82.03 17.44-2.58 24.76-7.5-12.75 8.2-40.05 2.86-40.05-10.41 0-5.67 6.25-9.77 13.82-9.77z" />
            <path d="M10.43 70.43c-.02 13.27 27.34 18.62 40.07 10.39 2.51-1.69 4.86-3.61 7.01-5.74-.42-.29-2.6-1.87-5.1-3.49-1.83-1.19-3.88-2.36-5.3-3.2-15.23 17.59-36.68 12.93-36.68 2.04z" />
            <path d="M86.97 88.33c6.14 0 7.75-7.66 8.03-13.69.05-1.16-.84-2.15-2.01-2.2-16.8-.53-28.45-7.18-40.1-12.67 12.84 11.02 18.35 28.57 34.11 28.57z" />
          </svg>
        </div>
      );

    // 28. 蚂蚁花呗 (HUABEI) - 官方正版花呗旋翼标
    case 'huabei':
      return (
        <div
          className={`${currentSize} rounded-full bg-white flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden border border-slate-100 ${className}`}
          title="蚂蚁花呗 Ant Huabei"
        >
          <svg viewBox="0 0 60 60" fill="none" className="w-full h-full scale-[0.88]" aria-hidden="true">
            <path d="M30.819 18.126c2.468.625 4.843-.488 5.309-2.502s-1.158-4.145-3.622-4.77c-2.465-.626-4.843.485-5.305 2.501s1.154 4.147 3.62 4.777" fill="#1677ff" />
            <path d="M33.956 21.683c-4.573-.893-7.781-2.642-10.083-3.242-1.341-.349-3.066-.184-3.862 1.127-.955 1.57.025 3.351 1.58 4.085 13.768 6.484 15.24 12.75 12.378 18.002-4.85 8.907-21.99 2.489-22.005-10.306 0-6.028 3.737-9.289 3.831-11.83.077-2.03-1.762-3.897-3.954-3.662-4.914.534-6.796 9.462-6.796 14.1 0 14.164 11.266 25.854 24.975 25.854S55 44.13 55 29.966c0-11.936-7.397-21.97-18.636-25.532-2.09-.663-3.298.073-3.747 1.12-.536 1.25-.072 2.622 1.672 3.398 1.861.798 3.576 1.9 5.074 3.26 4.902 4.512.659 10.65-5.398 9.47" fill="#1677ff" />
          </svg>
        </div>
      );

    // 29. 微信支付 (WECHAT) - 官方翡翠绿双气泡
    case 'wechat':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#07C160] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="微信支付 WeChat Pay"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <path d="M42 22 C25 22 12 33 12 47 C12 55 17 62 25 67 L21 78 L33 72 C36 73 39 73 42 73 C42 72 42 70 42 68 C42 53 56 41 72 41 C73 41 75 41 76 41 C73 30 59 22 42 22 Z M32 36 A5 5 0 1 1 32 46 A5 5 0 1 1 32 36 Z M52 36 A5 5 0 1 1 52 46 A5 5 0 1 1 52 36 Z" />
            <path d="M70 44 C56 44 45 53 45 65 C45 71 49 77 55 81 L52 90 L61 86 C64 87 67 87 70 87 C84 87 95 77 95 65 C95 53 84 44 70 44 Z M62 55 A4 4 0 1 1 62 63 A4 4 0 1 1 62 55 Z M78 55 A4 4 0 1 1 78 63 A4 4 0 1 1 78 55 Z" />
          </svg>
        </div>
      );

    // 30. 京东金融 (JD_FINANCE)
    case 'jd':
    case 'jd_finance':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#E1251B] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="京东金融 JD Finance"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white scale-[0.88]" aria-hidden="true">
            <g id="jd">
              <path d="M45.5,50.5V40.1H6.4v10.4v0H23v10c0,1.8-0.3,2.8-1,3.3c-0.6,0.6-1.6,0.9-2.9,0.9v3.1c3.4-0.1,5.8-0.8,7.4-2.2 c1.6-1.4,2.3-3.4,2.3-6.2v-8.9L45.5,50.5L45.5,50.5z M39.9,47.3H12.1v-4h27.8V47.3z"/>
              <polygon points="28.9,32.2 23,32.2 23,34.6 5,34.6 5,37.9 46.9,37.9 46.9,34.6 28.9,34.6 "/>
              <path d="M5,67.7h3.3c7.1-6.2,9-15,9-15h-6.4C10.1,59,7.5,64.2,5,67.7z"/>
              <path d="M34.6,52.7c0,0,1.9,8.8,9,15h3.3c-2.5-3.5-5.1-8.8-5.9-15H34.6z"/>
              <path d="M53.1,67.7h3.3c7.1-6.2,9-15,9-15h-6.4C58.2,59,55.5,64.2,53.1,67.7z"/>
              <path d="M82.7,52.7c0,0,1.9,8.8,9,15H95c-2.5-3.5-5.1-8.8-5.9-15H82.7z"/>
              <path d="M67.8,34.6l1.1-2.5h-5.9l-1.2,2.5h-8.9v3.3h7.3l-5.9,12.7h17v10c0,1.9-0.3,2.8-1,3.3c-0.6,0.6-1.6,0.9-2.9,0.9 v3.1c3.4-0.1,5.8-0.8,7.4-2.2c1.6-1.4,2.3-3.4,2.3-6.2v-8.9h16.2v-0.2v-3.1H77.4v-7h-5.8v7H62l4.3-9.4H95v-3.3H67.8z"/>
            </g>
          </svg>
        </div>
      );

    // 30b. 京东白条 (JD_BAITIAO)
    case 'baitiao':
    case 'jd_baitiao':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#EC4899] flex items-center justify-center p-0.5 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="京东白条 JD Baitiao"
        >
          <span className="font-black text-[9px] sm:text-[10px] text-white tracking-tight select-none">白条</span>
        </div>
      );

    // 31. 余额宝 (YUEBAO) - 官方正版金币福袋标
    case 'yuebao':
    case 'yuebaobao':
      return (
        <div
          className={`${currentSize} rounded-full bg-white flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden border border-slate-100 ${className}`}
          title="余额宝 Yuebao"
        >
          <svg viewBox="0 0 60 60" fill="none" className="w-full h-full scale-[0.88]" aria-hidden="true">
            <path d="M30.247 14.3c-13.671 0-24.754 10.836-24.754 24.55 0 13.713 11.083 18.405 24.754 18.405C43.917 57.255 55 52.563 55 38.849S43.917 14.301 30.247 14.301m9.487 20.653A1.65 1.65 0 0 1 38.09 36.6h-5.37a.41.41 0 0 0-.413.411v2.9h5.78a1.645 1.645 0 0 1 1.646 1.647v.836a1.65 1.65 0 0 1-1.646 1.647h-5.37a.416.416 0 0 0-.418.417v3.716a1.647 1.647 0 0 1-1.646 1.648h-.832a1.64 1.64 0 0 1-1.646-1.648v-3.716a.416.416 0 0 0-.397-.417h-5.37a1.645 1.645 0 0 1-1.646-1.647v-.836a1.65 1.65 0 0 1 1.646-1.647h5.778v-2.892a.41.41 0 0 0-.408-.414h-5.37a1.645 1.645 0 0 1-1.646-1.647v-.836a1.65 1.65 0 0 1 1.646-1.644h4.921l-5.1-5.106a1.65 1.65 0 0 1 0-2.335l.584-.586a1.65 1.65 0 0 1 2.333 0l4.809 4.815a.416.416 0 0 0 .585 0l4.811-4.818a1.65 1.65 0 0 1 2.333 0l.586.586a1.65 1.65 0 0 1 0 2.335l-5.102 5.106h4.924a1.645 1.645 0 0 1 1.646 1.647zm-9.487-22.298c5.37 0 8.843-1.795 10.792-3.859 1.098-1.287 1.023-2.937-.343-3.926-2.073-1.497-6.054-2.126-10.45-2.126-4.394 0-8.376.63-10.448 2.126-1.367.989-1.442 2.639-.344 3.926 1.949 2.064 5.423 3.86 10.793 3.86" fill="#ff5b00" />
          </svg>
        </div>
      );

    // 32. 苹果支付 (APPLEPAY)
    case 'applepay':
      return (
        <div
          className={`${currentSize} rounded-full bg-black flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="Apple Pay"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-white" aria-hidden="true">
            <path d="M68 50 C68 41 76 36 76 36 C72 30 65 29 63 29 C57 28 51 32 48 32 C45 32 40 28 35 29 C27 29 19 35 15 44 C8 58 13 78 20 88 C24 93 28 99 34 99 C39 99 41 96 47 96 C53 96 55 99 61 99 C66 99 70 94 74 88 C78 82 80 77 80 76 C80 76 68 71 68 50 Z M56 21 C59 17 61 12 60 7 C55 7 50 10 47 14 C44 18 42 23 43 28 C49 28 53 25 56 21 Z" />
          </svg>
        </div>
      );

    // 33. 云闪付 (UNIONPAY APP)
    case 'unionpay_app':
      return (
        <div
          className={`${currentSize} rounded-full bg-[#C8102E] flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden ${className}`}
          title="云闪付 UnionPay App"
        >
          <span className="font-bold text-[8px] sm:text-[9px] text-white tracking-tighter">云闪付</span>
        </div>
      );

    // 34. 黄金积存金 (GOLD)
    case 'gold':
      return (
        <div
          className={`${currentSize} rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden text-amber-950 font-bold ${className}`}
          title="黄金理财 24K Gold"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
            <path d="M4 8h16l-3 9H7L4 8zm2.4 2l1.7 5h7.8l1.7-5H6.4zM8 4h8v2H8V4z" />
          </svg>
        </div>
      );

    // 35. 公募基金 (FUND)
    case 'fund':
      return (
        <div
          className={`${currentSize} rounded-full bg-purple-600 flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden text-white ${className}`}
          title="公募基金 Mutual Fund"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
            <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
          </svg>
        </div>
      );

    // 36. 现金储备 (CASH)
    case 'cash':
      return (
        <div
          className={`${currentSize} rounded-full bg-emerald-600 flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden text-white ${className}`}
          title="现金备用金 Cash"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2zM12 14c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
          </svg>
        </div>
      );

    // 37. 借出款项 (RECEIVABLE)
    case 'receivable':
      return (
        <div
          className={`${currentSize} rounded-full bg-cyan-600 flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden text-white ${className}`}
          title="借出款项 (债权待收)"
        >
          <span className="font-medium text-[8px] sm:text-[9px]">待收</span>
        </div>
      );

    // 38. 借入款项 (PAYABLE)
    case 'payable':
      return (
        <div
          className={`${currentSize} rounded-full bg-purple-700 flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden text-white ${className}`}
          title="借入款项 (债务待还)"
        >
          <span className="font-medium text-[8px] sm:text-[9px]">待还</span>
        </div>
      );

    // 通用银行卡缺省
    default:
      return (
        <div
          className={`${currentSize} rounded-full bg-slate-800 flex items-center justify-center p-1 shadow-xs shrink-0 select-none overflow-hidden text-white ${className}`}
          title="银行卡账户"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
          </svg>
        </div>
      );
  }
};

/**
 * 国际主流卡组织徽标：
 * - 中国银联 (UnionPay) - 官方正版红蓝青三色斜带 + 优雅矢量银联中英文字体
 * - VISA - 经典矢量字标 + 左上翼金光弧
 * - 万事达 (Mastercard) - 双色正圆交错
 * - 美国运通 (AMEX) - 经典运通蓝白居中标
 * - JCB - 经典三色圆角条标
 * 全透明背景，严格保留在卡面右上角展示
 */
export const CardNetworkBadge: React.FC<{
  network?: 'UNIONPAY' | 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'NONE';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ network = 'UNIONPAY', className = '', size = 'md' }) => {
  if (!network || network === 'NONE') return null;

  // 1. VISA
  if (network === 'VISA') {
    const dim =
      size === 'sm' ? 'w-10 h-3.5' : size === 'lg' ? 'w-16 h-5.5' : 'w-12 h-4 sm:w-14 sm:h-4.5';
    return (
      <div
        className={`inline-flex items-center justify-center select-none shrink-0 ${className}`}
        title="VISA 国际卡组织"
      >
        <svg
          viewBox="0 7.8 24 8.5"
          className={`${dim} drop-shadow-sm`}
          style={{ overflow: 'visible' }}
        >
          <path
            d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z"
            fill="#FFFFFF"
          />
          <path
            d="M0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338C4.5 11.8 3.5 10.5 2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479z"
            fill="#F7B600"
          />
        </svg>
      </div>
    );
  }

  // 2. 万事达 (Mastercard)
  if (network === 'MASTERCARD') {
    const dim =
      size === 'sm' ? 'w-8 h-5' : size === 'lg' ? 'w-14 h-9' : 'w-11 h-7 sm:w-12 sm:h-7.5';
    return (
      <div
        className={`inline-flex items-center justify-center select-none shrink-0 ${className}`}
        title="Mastercard 万事达卡"
      >
        <svg
          viewBox="0 0 256 158"
          className={`${dim} drop-shadow-md`}
          style={{ overflow: 'visible' }}
        >
          <rect fill="#FF5F00" x="93.298" y="16.903" width="69.15" height="124.251" />
          <path
            d="M97.689 79.029C97.689 53.784 109.543 31.392 127.763 16.903 114.372 6.366 97.469 0 79.029 0 35.343 0 0 35.343 0 79.029s35.343 79.029 79.029 79.029c18.44 0 35.343-6.366 48.734-16.903C109.543 126.885 97.689 104.274 97.689 79.029z"
            fill="#EB001B"
          />
          <path
            d="M255.746 79.029c0 43.685-35.343 79.029-79.029 79.029-18.44 0-35.343-6.366-48.734-16.903 18.44-14.489 30.075-36.88 30.075-62.126s-11.855-47.637-30.075-62.126C141.374 6.366 158.277 0 176.717 0c43.685 0 79.029 35.563 79.029 79.029z"
            fill="#F79E1B"
          />
        </svg>
      </div>
    );
  }

  // 3. 美国运通 (AMEX)
  if (network === 'AMEX') {
    const dim = size === 'sm' ? 'h-3.5 px-1.5' : size === 'lg' ? 'h-5.5 px-2.5' : 'h-4.5 px-2';
    return (
      <div
        className={`inline-flex items-center justify-center rounded-[3px] bg-[#006FCF] text-white select-none ${dim} shadow-xs border border-white/30 shrink-0 ${className}`}
        title="American Express 美国运通"
      >
        <span className="font-medium tracking-tight uppercase text-[9px] sm:text-[10px] leading-none">
          AMEX
        </span>
      </div>
    );
  }

  // 4. JCB
  if (network === 'JCB') {
    const height = size === 'sm' ? 'h-3.5' : size === 'lg' ? 'h-5.5' : 'h-4.5';
    return (
      <div
        className={`inline-flex items-center overflow-hidden rounded-[3px] select-none ${height} drop-shadow-sm shrink-0 ${className}`}
        title="JCB 国际卡组织"
      >
        <div className="flex items-center h-full space-x-[1px]">
          <div className="w-2.5 sm:w-3 h-full rounded-l-xs bg-[#003780] flex items-center justify-center">
            <span className="text-[8px] sm:text-[9px] font-medium text-white leading-none">J</span>
          </div>
          <div className="w-2.5 sm:w-3 h-full bg-[#DD1124] flex items-center justify-center">
            <span className="text-[8px] sm:text-[9px] font-medium text-white leading-none">C</span>
          </div>
          <div className="w-2.5 sm:w-3 h-full rounded-r-xs bg-[#008940] flex items-center justify-center">
            <span className="text-[8px] sm:text-[9px] font-medium text-white leading-none">B</span>
          </div>
        </div>
      </div>
    );
  }

  // 5. 中国银联 (UNIONPAY) - 官方正版矢量规范
  const dim = size === 'sm' ? 'w-10 h-4.5' : size === 'lg' ? 'w-16 h-7' : 'w-12 h-5 sm:w-14 sm:h-6';
  return (
    <div
      className={`inline-flex items-center justify-center select-none shrink-0 ${className}`}
      title="中国银联 UnionPay"
    >
      <svg
        viewBox="0 0 96 46"
        className={`${dim} drop-shadow-sm`}
        style={{ overflow: 'visible' }}
      >
        <g transform="skewX(-14)">
          <rect x="22" y="2" width="22" height="42" rx="3.5" fill="#C8102E" />
          <rect x="42" y="2" width="22" height="42" rx="3.5" fill="#002F6C" />
          <rect x="62" y="2" width="22" height="42" rx="3.5" fill="#007B83" />
        </g>
        <text
          x="30"
          y="23"
          fill="#FFFFFF"
          fontSize="14.5"
          fontWeight="700"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.4"
        >
          银联
        </text>
        <text
          x="26"
          y="36"
          fill="#FFFFFF"
          fontSize="8"
          fontWeight="600"
          fontStyle="italic"
          fontFamily="Arial, Helvetica, sans-serif"
          letterSpacing="0.2"
        >
          UnionPay
        </text>
      </svg>
    </div>
  );
};

/**
 * 仿真智能 EMV 芯片 (ISO/IEC 7816)
 */
export const EMVChip: React.FC<{ className?: string; size?: 'sm' | 'md' }> = ({
  className = '',
  size = 'md',
}) => {
  const chipDim = size === 'sm' ? 'w-7 h-5 rounded-md' : 'w-9 h-6.5 rounded-lg';
  return (
    <div
      className={`${chipDim} bg-gradient-to-tr from-amber-300 via-yellow-100 to-amber-400 border border-amber-500/70 shadow-inner relative overflow-hidden flex flex-col justify-between p-0.5 shrink-0 select-none ${className}`}
      title="EMV 智能防伪安全芯片"
    >
      <div className="w-full h-px bg-amber-600/50 my-auto" />
      <div className="w-full h-px bg-amber-600/50 my-auto" />
      <div className="absolute inset-y-0 left-1/2 w-px bg-amber-600/50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-2 rounded-xs border border-amber-600/60 bg-amber-200/40" />
    </div>
  );
};

/**
 * 非接触式无线感应射频波 (Contactless NFC)
 */
export const ContactlessIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 fill-none stroke-current stroke-[1.8] opacity-75 shrink-0 ${className}`}
      aria-hidden="true"
    >
      <title>NFC 非接触式无线感应</title>
      <path d="M8.5 14.5A4.5 4.5 0 0 1 12 10a4.5 4.5 0 0 1 3.5 4.5" strokeLinecap="round" />
      <path d="M6 16.5A7.5 7.5 0 0 1 12 7a7.5 7.5 0 0 1 6 9.5" strokeLinecap="round" />
      <path d="M3.5 18.5A10.5 10.5 0 0 1 12 4a10.5 10.5 0 0 1 8.5 14.5" strokeLinecap="round" />
    </svg>
  );
};
