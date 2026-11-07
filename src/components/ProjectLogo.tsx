import React, { useState, useMemo } from 'react';
import {
  FolderKanban,
  Hammer,
  Plane,
  Briefcase,
  Heart,
  Building,
  Car,
  GraduationCap,
  Tv,
  Activity,
  Folder,
  Laptop,
  Coffee,
  Rocket,
  Palette,
  Utensils,
  Gamepad2,
  ShoppingBag,
  Home,
  PiggyBank,
  Sparkles,
  Wrench,
  Smartphone,
  Gift,
  Dumbbell,
  Music,
  TrendingUp,
  Shield,
  Globe,
  Camera,
  BookOpen,
  DollarSign,
  LucideIcon,
} from 'lucide-react';
import { LedgerProject } from '../types';

export const PROJECT_ICON_MAP: Record<string, LucideIcon> = {
  FolderKanban,
  Hammer,
  Plane,
  Briefcase,
  Heart,
  Building,
  Car,
  GraduationCap,
  Tv,
  Activity,
  Folder,
  Laptop,
  Coffee,
  Rocket,
  Palette,
  Utensils,
  Gamepad2,
  ShoppingBag,
  Home,
  PiggyBank,
  Sparkles,
  Wrench,
  Smartphone,
  Gift,
  Dumbbell,
  Music,
  TrendingUp,
  Shield,
  Globe,
  Camera,
  BookOpen,
  DollarSign,
};

export const PRESET_PROJECT_ICONS = [
  { id: 'FolderKanban', name: '通用看板', icon: FolderKanban },
  { id: 'Home', name: '房产家装', icon: Home },
  { id: 'Hammer', name: '工程装修', icon: Hammer },
  { id: 'Plane', name: '旅行出游', icon: Plane },
  { id: 'Briefcase', name: '商业副业', icon: Briefcase },
  { id: 'Laptop', name: '数码IT', icon: Laptop },
  { id: 'Car', name: '汽车出行', icon: Car },
  { id: 'Heart', name: '婚礼情感', icon: Heart },
  { id: 'GraduationCap', name: '学习培训', icon: GraduationCap },
  { id: 'Building', name: '企业出差', icon: Building },
  { id: 'Tv', name: '大家电', icon: Tv },
  { id: 'Activity', name: '医疗健康', icon: Activity },
  { id: 'PiggyBank', name: '专项储蓄', icon: PiggyBank },
  { id: 'TrendingUp', name: '投资理财', icon: TrendingUp },
  { id: 'Rocket', name: '初创孵化', icon: Rocket },
  { id: 'Coffee', name: '日常休闲', icon: Coffee },
  { id: 'Utensils', name: '美食餐饮', icon: Utensils },
  { id: 'ShoppingBag', name: '购物狂欢', icon: ShoppingBag },
  { id: 'Gamepad2', name: '游戏数娱', icon: Gamepad2 },
  { id: 'Palette', name: '艺术设计', icon: Palette },
  { id: 'Music', name: '音乐影视', icon: Music },
  { id: 'Dumbbell', name: '健身运动', icon: Dumbbell },
  { id: 'Smartphone', name: '手机硬件', icon: Smartphone },
  { id: 'Globe', name: '出海海外', icon: Globe },
  { id: 'Camera', name: '摄影器材', icon: Camera },
  { id: 'Gift', name: '人情送礼', icon: Gift },
];

export const PRESET_PROJECT_EMOJIS = [
  '🏠', '✈️', '💼', '💻', '🚗', '💍', '🎓', '🏢',
  '💰', '🚀', '🎨', '🏖️', '🛠️', '🏥', '🎮', '☕',
  '🛍️', '🐶', '🍕', '⚽', '📱', '🎵', '💡', '🎁',
  '🚢', '⛺', '👶', '🚴', '📚', '🎯', '🍣', '🌟'
];

export interface ProjectLogoProps {
  project?: Partial<LedgerProject> | null;
  logo?: string;
  icon?: string;
  name?: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  shape?: 'rounded' | 'circle' | 'square';
  showBackground?: boolean;
}

const getSafeTintBg = (colorStr?: string, opacityHex = '18') => {
  if (!colorStr) return 'transparent';
  if (colorStr.startsWith('#')) {
    if (colorStr.length === 7) return `${colorStr}${opacityHex}`;
    if (colorStr.length === 4) {
      const r = colorStr[1];
      const g = colorStr[2];
      const b = colorStr[3];
      return `#${r}${r}${g}${g}${b}${b}${opacityHex}`;
    }
  }
  return colorStr;
};

/**
 * Options for parsing and sanitizing SVG strings
 */
export interface SvgSanitizeOptions {
  /** Remove accidental full-bleed artboard background rectangles that break transparency (e.g. from Figma / Illustrator) */
  removeBackground?: boolean;
}

/**
 * Validates, sanitizes, and normalizes SVG strings into safe, scalable, transparent SVG Data URLs.
 * Crucially strips out accidental full-bleed black/opaque artboard rectangles to guarantee pure transparency.
 */
export const parseAndSanitizeSvg = (
  svgText: string,
  options: SvgSanitizeOptions = { removeBackground: true }
): string => {
  if (!svgText || typeof svgText !== 'string') {
    throw new Error('未提供有效的 SVG 内容');
  }

  const trimmed = svgText.trim();
  const parser = new DOMParser();
  const doc = parser.parseFromString(trimmed, 'image/svg+xml');

  // Verify XML syntax
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('SVG 文件解析失败：请确保是合法的 SVG 矢量图形格式');
  }

  const svgEl = doc.querySelector('svg');
  if (!svgEl) {
    throw new Error('未检测到有效的 <svg> 根标签');
  }

  // 1. Security Sanitization: Remove dangerous executable tags
  const dangerousTags = ['script', 'foreignobject', 'iframe', 'object', 'embed'];
  dangerousTags.forEach((tag) => {
    svgEl.querySelectorAll(tag).forEach((el) => el.remove());
  });

  // Remove dangerous attributes and event handlers (onload, onclick, etc.)
  const allElements = [svgEl, ...Array.from(svgEl.querySelectorAll('*'))];
  allElements.forEach((el) => {
    const attrsToRemove: string[] = [];
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      const name = attr.name.toLowerCase();
      const val = attr.value.toLowerCase().trim();

      if (
        name.startsWith('on') ||
        val.startsWith('javascript:') ||
        val.startsWith('data:text/html')
      ) {
        attrsToRemove.push(attr.name);
      }
    }
    attrsToRemove.forEach((a) => el.removeAttribute(a));
  });

  // 2. Ensure standard SVG namespace for browser img rendering
  if (!svgEl.hasAttribute('xmlns')) {
    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }

  // 3. Ensure responsive viewBox for crisp vector scaling without distortion
  let viewBox = svgEl.getAttribute('viewBox');
  const widthAttr = svgEl.getAttribute('width');
  const heightAttr = svgEl.getAttribute('height');

  const numWidth = widthAttr ? parseFloat(widthAttr.replace(/[^0-9.]/g, '')) : null;
  const numHeight = heightAttr ? parseFloat(heightAttr.replace(/[^0-9.]/g, '')) : null;

  if (!viewBox) {
    if (numWidth && numHeight && !isNaN(numWidth) && !isNaN(numHeight)) {
      viewBox = `0 0 ${numWidth} ${numHeight}`;
      svgEl.setAttribute('viewBox', viewBox);
    } else {
      viewBox = '0 0 24 24';
      svgEl.setAttribute('viewBox', viewBox);
    }
  }

  // Ensure fluid auto-scaling inside flex/grid containers
  svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svgEl.setAttribute('width', '100%');
  svgEl.setAttribute('height', '100%');

  // 4. Resolve transparency issues: Detect and eliminate full-bleed background rects & artboards
  // Many design tools (Figma, Sketch, Illustrator, Canva) export an artboard background rect (e.g. fill="#000000" or fill="black" or background style)
  // which makes transparent logos render with a solid black/opaque box.
  if (options.removeBackground !== false) {
    // Strip root background CSS properties on <svg>
    svgEl.style.removeProperty('background');
    svgEl.style.removeProperty('background-color');
    svgEl.removeAttribute('background');
    const svgRootFill = (svgEl.getAttribute('fill') || '').trim().toLowerCase();
    if (svgRootFill === '#000' || svgRootFill === '#000000' || svgRootFill === 'black' || svgRootFill === 'rgb(0,0,0)') {
      svgEl.removeAttribute('fill');
    }

    const viewBoxParts = viewBox.split(/[\s,]+/).map(Number);
    const vbW = viewBoxParts[2] || numWidth || 0;
    const vbH = viewBoxParts[3] || numHeight || 0;

    const darkColorRegex = /^(#000|#000000|black|#111|#111111|#18181b|#0f172a|#1e1e1e|#1a1a1a|#222|#262626|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)|rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*1\s*\))$/i;

    // Check all rects in the SVG
    const allRects = Array.from(svgEl.querySelectorAll('rect'));
    for (const rect of allRects) {
      const x = parseFloat(rect.getAttribute('x') || '0');
      const y = parseFloat(rect.getAttribute('y') || '0');
      const wStr = (rect.getAttribute('width') || '').trim();
      const hStr = (rect.getAttribute('height') || '').trim();
      const w = parseFloat(wStr.replace(/[^0-9.]/g, ''));
      const h = parseFloat(hStr.replace(/[^0-9.]/g, ''));

      const isOrigin = Math.abs(x) < 0.1 && Math.abs(y) < 0.1;
      const isFull =
        (wStr === '100%' && hStr === '100%') ||
        (vbW > 0 && vbH > 0 && w >= vbW * 0.95 && h >= vbH * 0.95);

      const fill = (rect.getAttribute('fill') || '').trim().toLowerCase();
      const style = (rect.getAttribute('style') || '').toLowerCase();
      const id = (rect.getAttribute('id') || '').toLowerCase();
      const className = (rect.getAttribute('class') || '').toLowerCase();

      const isBackgroundIdOrClass =
        id.includes('background') ||
        id.includes('artboard') ||
        id === 'bg' ||
        className.includes('background') ||
        className.includes('canvas-bg');

      const isDarkFill =
        darkColorRegex.test(fill) ||
        style.includes('fill: #000') ||
        style.includes('fill:black') ||
        style.includes('fill: rgb(0, 0, 0)') ||
        style.includes('fill:#000000');

      if ((isOrigin && isFull && (isDarkFill || isBackgroundIdOrClass)) || (isFull && isDarkFill)) {
        rect.remove();
      }
    }
  }

  // 5. Serialize to clean, lightweight UTF-8 Data URL
  const serializer = new XMLSerializer();
  const serialized = serializer.serializeToString(svgEl);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;
};

/**
 * Checks if a logo value is an SVG graphic (Data URL, raw markup, or .svg link)
 */
export const isSvgLogo = (value?: string): boolean => {
  if (!value) return false;
  const str = value.trim();
  return (
    str.startsWith('data:image/svg+xml') ||
    str.startsWith('<svg') ||
    str.includes('</svg>') ||
    str.toLowerCase().endsWith('.svg') ||
    str.includes('.svg?')
  );
};

export const ProjectLogo: React.FC<ProjectLogoProps> = ({
  project,
  logo: directLogo,
  icon: directIcon,
  name: directName,
  color: directColor,
  size = 'md',
  className = '',
  shape = 'rounded',
  showBackground = true,
}) => {
  const [imageError, setImageError] = useState(false);

  const rawLogoValue = directLogo || project?.logo || directIcon || project?.icon || '';
  const projectName = directName || project?.name || '项目';
  const projectColor = directColor || project?.color || '#0d9488';

  // Automatically parse and convert raw inline SVG markup (<svg>...</svg>) to clean Data URL
  const logoValue = useMemo(() => {
    if (rawLogoValue && rawLogoValue.trim().startsWith('<svg') && rawLogoValue.includes('</svg>')) {
      try {
        return parseAndSanitizeSvg(rawLogoValue);
      } catch {
        return rawLogoValue;
      }
    }
    return rawLogoValue;
  }, [rawLogoValue]);

  // Size specifications
  const sizeMap = {
    xs: {
      container: 'w-4 h-4 text-[10px]',
      icon: 'w-2.5 h-2.5',
      emoji: 'text-[11px]',
      rounded: 'rounded-md',
      imgPadding: 'p-0',
    },
    sm: {
      container: 'w-6 h-6 text-xs',
      icon: 'w-3.5 h-3.5',
      emoji: 'text-sm',
      rounded: 'rounded-lg',
      imgPadding: 'p-0.5',
    },
    md: {
      container: 'w-9 h-9 text-sm',
      icon: 'w-4.5 h-4.5',
      emoji: 'text-lg',
      rounded: 'rounded-xl',
      imgPadding: 'p-1',
    },
    lg: {
      container: 'w-11 h-11 text-base',
      icon: 'w-5.5 h-5.5',
      emoji: 'text-2xl',
      rounded: 'rounded-2xl',
      imgPadding: 'p-1.5',
    },
    xl: {
      container: 'w-14 h-14 text-xl',
      icon: 'w-7 h-7',
      emoji: 'text-3xl',
      rounded: 'rounded-2xl',
      imgPadding: 'p-2',
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const radiusClass =
    shape === 'circle' ? 'rounded-full' : shape === 'square' ? 'rounded-none' : currentSize.rounded;

  // Determine logo type:
  const isImage =
    !imageError &&
    Boolean(
      logoValue &&
        (logoValue.startsWith('data:image/') ||
          logoValue.startsWith('http://') ||
          logoValue.startsWith('https://') ||
          logoValue.startsWith('blob:'))
    );

  const isEmoji =
    !isImage &&
    Boolean(
      logoValue &&
        /\p{Extended_Pictographic}/u.test(logoValue)
    );

  const MatchedLucideIcon = !isImage && !isEmoji && logoValue ? PROJECT_ICON_MAP[logoValue] : null;

  // Render Image / SVG Vector (supports transparent SVG, PNG, WebP with pure transparency)
  if (isImage) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden flex items-center justify-center ${
          showBackground
            ? 'bg-transparent border border-slate-200/60 dark:border-slate-700/60 shadow-2xs'
            : 'bg-transparent border-transparent'
        } ${currentSize.container} ${radiusClass} ${className}`}
      >
        <img
          src={logoValue}
          alt={projectName}
          onError={() => setImageError(true)}
          className={`w-full h-full object-contain ${currentSize.imgPadding || 'p-0.5'}`}
        />
      </div>
    );
  }

  // Render Emoji
  if (isEmoji) {
    return (
      <div
        className={`relative shrink-0 flex items-center justify-center select-none shadow-2xs ${currentSize.container} ${radiusClass} ${className}`}
        style={
          showBackground
            ? {
                backgroundColor: `${projectColor}20`,
                borderColor: `${projectColor}40`,
                borderWidth: '1px',
              }
            : undefined
        }
      >
        <span className={`leading-none flex items-center justify-center ${currentSize.emoji}`}>
          {logoValue}
        </span>
      </div>
    );
  }

  // Render Lucide Icon
  if (MatchedLucideIcon) {
    return (
      <div
        className={`relative shrink-0 flex items-center justify-center text-white shadow-2xs font-bold ${currentSize.container} ${radiusClass} ${className}`}
        style={showBackground ? { backgroundColor: projectColor } : undefined}
      >
        <MatchedLucideIcon className={currentSize.icon} />
      </div>
    );
  }

  // Fallback: If project name exists, show first char or FolderKanban
  const firstLetter = projectName.trim() ? projectName.trim().charAt(0).toUpperCase() : '';
  const isChineseOrLetter = firstLetter && /[\u4e00-\u9fa5a-zA-Z0-9]/.test(firstLetter);

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center text-white shadow-2xs font-bold select-none ${currentSize.container} ${radiusClass} ${className}`}
      style={showBackground ? { backgroundColor: projectColor } : undefined}
    >
      {isChineseOrLetter ? (
        <span className="leading-none font-bold tracking-tight">{firstLetter}</span>
      ) : (
        <FolderKanban className={currentSize.icon} />
      )}
    </div>
  );
};

/**
 * Utility to process user-uploaded image files into small, lightweight Data URLs.
 * - Handles .svg files directly via DOM parsing & sanitization to retain 100% vector scalability and true transparency.
 * - Handles PNG / WebP / JPEG with alpha transparency preservation, completely eliminating black backgrounds.
 */
export const compressImageToDataUrl = async (
  file: File,
  maxDimension = 256,
  quality = 0.85
): Promise<string> => {
  // Check if file is SVG (either by MIME type or .svg extension)
  const isSvg =
    file.type === 'image/svg+xml' ||
    file.name.toLowerCase().endsWith('.svg') ||
    file.type.includes('svg');

  if (isSvg) {
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('SVG 文件过大，请选择小于 2MB 的矢量图标');
    }
    const svgText = await file.text();
    return parseAndSanitizeSvg(svgText, { removeBackground: true });
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('请选择有效的图片或 .svg 矢量文件');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawResult = e.target?.result as string;

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext('2d', { alpha: true });
          if (!ctx) {
            resolve(rawResult);
            return;
          }

          // Clear canvas cleanly so transparent pixels remain 100% transparent
          ctx.clearRect(0, 0, width, height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Detect transparency: PNG, WebP, GIF, or canvas pixel alpha
          const isTransparentFormat =
            file.type === 'image/png' ||
            file.type === 'image/webp' ||
            file.type === 'image/gif' ||
            !file.type;

          let hasAlphaTransparency = isTransparentFormat;

          // If not confirmed by mime type, inspect actual pixels for transparent alpha
          if (!hasAlphaTransparency) {
            try {
              const imgData = ctx.getImageData(0, 0, width, height);
              const data = imgData.data;
              for (let i = 3; i < data.length; i += 4) {
                if (data[i] < 250) {
                  hasAlphaTransparency = true;
                  break;
                }
              }
            } catch {
              // fallback to format flag
            }
          }

          // CRITICAL:
          // Always export transparent and raster images as image/png.
          // Never export to image/jpeg which destroys alpha channels and converts transparent backgrounds into solid black!
          const output = canvas.toDataURL('image/png');
          resolve(output);
        } catch {
          resolve(rawResult);
        }
      };
      img.onerror = () => reject(new Error('无法解析图片内容'));
      img.src = rawResult;
    };
    reader.onerror = () => reject(new Error('读取图片文件失败'));
    reader.readAsDataURL(file);
  });
};
