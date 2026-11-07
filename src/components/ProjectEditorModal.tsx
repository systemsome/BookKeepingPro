import React, { useState, useRef } from 'react';
import {
  X,
  Check,
  FolderKanban,
  DollarSign,
  Calendar,
  Sparkles,
  Tag,
  AlignLeft,
  CheckCircle2,
  Clock,
  Archive,
  Palette,
  AlertTriangle,
  Trash2,
  Upload,
  Link2,
  Smile,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { LedgerProject, ProjectStatus, UserProfile } from '../types';
import {
  ProjectLogo,
  PRESET_PROJECT_ICONS,
  PRESET_PROJECT_EMOJIS,
  compressImageToDataUrl,
  parseAndSanitizeSvg,
  isSvgLogo,
} from './ProjectLogo';

interface ProjectEditorModalProps {
  initialProject?: LedgerProject | null;
  currentUser?: UserProfile | null;
  onClose: () => void;
  onSave?: (project: LedgerProject) => void;
  onSubmit?: (
    projectData: Omit<LedgerProject, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => void;
  onDelete?: (id: string) => void;
}

const PROJECT_CATEGORIES = [
  { name: '家装工程', color: '#0d9488', icon: 'Hammer' },
  { name: '旅行度假', color: '#f43f5e', icon: 'Plane' },
  { name: '副业经营', color: '#8b5cf6', icon: 'Briefcase' },
  { name: '婚礼筹备', color: '#ec4899', icon: 'Heart' },
  { name: '商务出差', color: '#0284c7', icon: 'Building' },
  { name: '车辆维护', color: '#ea580c', icon: 'Car' },
  { name: '专项进修', color: '#10b981', icon: 'GraduationCap' },
  { name: '家庭大件', color: '#6366f1', icon: 'Tv' },
  { name: '医疗健康', color: '#ef4444', icon: 'Activity' },
  { name: '其他项目', color: '#64748b', icon: 'Folder' },
];

const PRESET_COLORS = [
  '#0d9488', // Teal
  '#f43f5e', // Rose
  '#8b5cf6', // Purple
  '#0284c7', // Sky Blue
  '#ea580c', // Orange
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#eab308', // Amber
  '#475569', // Slate
];

export const ProjectEditorModal: React.FC<ProjectEditorModalProps> = ({
  initialProject,
  currentUser,
  onClose,
  onSave,
  onSubmit,
  onDelete,
}) => {
  const isEditing = !!initialProject;

  const [name, setName] = useState(initialProject?.name || '');
  const [description, setDescription] = useState(initialProject?.description || '');
  const [category, setCategory] = useState(initialProject?.category || '家装工程');
  const [budget, setBudget] = useState(initialProject?.budget?.toString() || '');
  const [status, setStatus] = useState<ProjectStatus>(
    initialProject?.isArchived ? 'ARCHIVED' : (initialProject?.status || 'ACTIVE')
  );
  const [startDate, setStartDate] = useState(
    initialProject?.startDate || new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(initialProject?.endDate || '');
  const [color, setColor] = useState(
    initialProject?.color ||
      PROJECT_CATEGORIES.find((c) => c.name === category)?.color ||
      '#0d9488'
  );

  // 项目 Logo 状态 (支持自定义图片 Data URL、在线图片 URL、Emoji 或预设图标)
  const defaultCategoryIcon = PROJECT_CATEGORIES.find((c) => c.name === category)?.icon || 'FolderKanban';
  const [logo, setLogo] = useState(initialProject?.logo || initialProject?.icon || defaultCategoryIcon);
  const [logoTab, setLogoTab] = useState<'ICON' | 'EMOJI' | 'UPLOAD' | 'URL'>('ICON');
  const [customUrl, setCustomUrl] = useState(logo.startsWith('http') ? logo : '');
  const [customEmojiInput, setCustomEmojiInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // 本地图片选择并压缩为轻量 Data URL，完整支持 .svg 矢量与透明度
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const dataUrl = await compressImageToDataUrl(file, 256, 0.85);
      setLogo(dataUrl);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setUploadError(err.message || '文件读取失败，请选择 .svg / PNG / WebP / JPG 格式');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyUrl = () => {
    const val = customUrl.trim();
    if (!val) return;
    setUploadError(null);
    // If user pasted raw SVG markup, parse & sanitize to valid SVG Data URL
    if (val.startsWith('<svg') || val.includes('</svg>')) {
      try {
        const cleanSvgDataUrl = parseAndSanitizeSvg(val);
        setLogo(cleanSvgDataUrl);
      } catch (err: any) {
        setUploadError(err.message || 'SVG 矢量代码格式有误，无法解析');
      }
    } else {
      setLogo(val);
    }
  };

  const handleApplyEmoji = (em: string) => {
    setLogo(em);
  };

  const handleClearLogo = () => {
    const fallback = PROJECT_CATEGORIES.find((c) => c.name === category)?.icon || 'FolderKanban';
    setLogo(fallback);
    setCustomUrl('');
    setCustomEmojiInput('');
    setUploadError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const numBudget = budget.trim() ? parseFloat(budget.trim()) : undefined;

    const isUrl = logo && (logo.startsWith('http://') || logo.startsWith('https://') || logo.startsWith('data:'));

    const projectData: LedgerProject = {
      id: initialProject?.id || `proj-${Date.now()}`,
      userId: currentUser?.id || initialProject?.userId,
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      icon: logo || defaultCategoryIcon,
      logo: logo || defaultCategoryIcon,
      logoUrl: isUrl ? logo : undefined,
      order: initialProject?.order,
      linkedAccountIds: initialProject?.linkedAccountIds,
      color,
      budget: numBudget && numBudget > 0 ? numBudget : undefined,
      status,
      isArchived: status === 'ARCHIVED',
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      createdAt: initialProject?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (onSave) {
      onSave(projectData);
    } else if (onSubmit) {
      const { id, createdAt, updatedAt, ...rest } = projectData;
      onSubmit(rest, initialProject?.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ProjectLogo
              logo={logo}
              name={name || '项目'}
              color={color}
              size="md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isEditing ? '编辑账本' : '新增账本'}
                </h3>
                {currentUser && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
                    <Check className="w-3 h-3 stroke-[3]" />
                    云端同步
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              项目名称 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：新房极简智能装修、2026日本枫叶旅行、出海工具副业..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
            />
          </div>

          {/* Project Logo & Icon Customizer */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ProjectLogo
                  logo={logo}
                  name={name || '项目'}
                  color={color}
                  size="md"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      项目 Logo / 专属标识
                    </label>
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold px-1.5 py-0.2 rounded bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/60">
                      支持自定义
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    支持精选矢量图标、Emoji、本地图片上传或网络链接
                  </p>
                </div>
              </div>

              {Boolean(logo && logo !== defaultCategoryIcon) && (
                <button
                  type="button"
                  onClick={handleClearLogo}
                  className="px-2 py-1 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                  title="恢复为默认类别图标"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>重置默认</span>
                </button>
              )}
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900 text-xs font-semibold gap-1">
              <button
                type="button"
                onClick={() => setLogoTab('ICON')}
                className={`flex-1 py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  logoTab === 'ICON'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>精选图标</span>
              </button>
              <button
                type="button"
                onClick={() => setLogoTab('EMOJI')}
                className={`flex-1 py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  logoTab === 'EMOJI'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Smile className="w-3.5 h-3.5" />
                <span>Emoji</span>
              </button>
              <button
                type="button"
                onClick={() => setLogoTab('UPLOAD')}
                className={`flex-1 py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  logoTab === 'UPLOAD'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>上传 / .SVG</span>
              </button>
              <button
                type="button"
                onClick={() => setLogoTab('URL')}
                className={`flex-1 py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  logoTab === 'URL'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>外链 / SVG代码</span>
              </button>
            </div>

            {/* Tab: Preset Icons */}
            {logoTab === 'ICON' && (
              <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {PRESET_PROJECT_ICONS.map((item) => {
                  const IconComp = item.icon;
                  const isSelected = logo === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLogo(item.id)}
                      className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-xs scale-105'
                          : 'bg-white dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-600/60'
                      }`}
                      title={item.name}
                    >
                      <IconComp className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tab: Emojis */}
            {logoTab === 'EMOJI' && (
              <div className="space-y-2">
                <div className="grid grid-cols-8 gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {PRESET_PROJECT_EMOJIS.map((em) => {
                    const isSelected = logo === em;
                    return (
                      <button
                        key={em}
                        type="button"
                        onClick={() => handleApplyEmoji(em)}
                        className={`w-9 h-9 text-lg rounded-xl flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-teal-100 dark:bg-teal-950/80 ring-2 ring-teal-500 scale-110'
                            : 'bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200/60 dark:border-slate-600/60'
                        }`}
                      >
                        {em}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700">
                  <input
                    type="text"
                    value={customEmojiInput}
                    onChange={(e) => setCustomEmojiInput(e.target.value)}
                    placeholder="输入或粘贴任意单字/Emoji (例如: 🚀 或 🚗)"
                    maxLength={4}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customEmojiInput.trim()) {
                        handleApplyEmoji(customEmojiInput.trim());
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors shrink-0"
                  >
                    应用
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Upload Custom Local Image / SVG */}
            {logoTab === 'UPLOAD' && (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".svg,image/svg+xml,image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="project-logo-upload-input"
                />

                {Boolean(
                  logo &&
                    (logo.startsWith('data:image/') ||
                      logo.startsWith('http://') ||
                      logo.startsWith('https://') ||
                      logo.startsWith('blob:') ||
                      logo.startsWith('<svg'))
                ) ? (
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Checkerboard transparency container to clearly show transparency without black background */}
                        <div
                          className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shadow-xs"
                          style={{
                            backgroundImage:
                              'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
                            backgroundSize: '10px 10px',
                            backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
                          }}
                          title="网格为透明背景示意，表示图片具备真实透明通道且不会变为黑底"
                        >
                          <img
                            src={logo}
                            alt="Logo预览"
                            className="w-full h-full object-contain p-1"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              自定义 Logo 已生效
                            </span>
                            {isSvgLogo(logo) ? (
                              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5 text-teal-500" />
                                SVG 矢量图 · 纯透明
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                透明背景已保留
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {isSvgLogo(logo)
                              ? '已解析 SVG 矢量节点并移除黑底图层，无损高保真缩放'
                              : 'PNG / WebP 透明通道完好，不会变为黑底'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <label
                          htmlFor="project-logo-upload-input"
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>重新更换</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleClearLogo}
                          className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="清除自定义图片，恢复默认类别图标"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="project-logo-upload-input"
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-teal-500 rounded-2xl cursor-pointer bg-white dark:bg-slate-700/60 transition-colors text-center group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                      {isUploading ? (
                        <Clock className="w-5 h-5 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isUploading ? '正在解析并优化矢量/图片...' : '点击选择或拖拽 .svg / 图片'}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      支持 .svg 矢量图标、PNG、WebP、JPG · 自动解析 SVG 矢量通道，杜绝黑底
                    </span>
                  </label>
                )}

                {uploadError && (
                  <p className="text-[11px] text-rose-500 font-semibold">{uploadError}</p>
                )}
              </div>
            )}

            {/* Tab: Image URL / Raw SVG Code */}
            {logoTab === 'URL' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://example.com/logo.svg 或直接粘贴 <svg>...</svg> 源码"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors shrink-0"
                  >
                    确认使用
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  支持外链图片（.svg / .png / .webp）或直接粘贴 SVG 矢量源码，自动解析并渲染纯透明 Logo。
                </p>
                {uploadError && (
                  <p className="text-[11px] text-rose-500 font-semibold">{uploadError}</p>
                )}
              </div>
            )}
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                项目类别
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const newCat = e.target.value;
                  setCategory(newCat);
                  const matched = PROJECT_CATEGORIES.find((c) => c.name === newCat);
                  if (matched && !isEditing) {
                    setColor(matched.color);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none font-medium"
              >
                {PROJECT_CATEGORIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                项目状态
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none font-medium"
              >
                <option value="ACTIVE">🟢 进行中 (Active)</option>
                <option value="COMPLETED">✅ 已结项 (Completed)</option>
                <option value="ARCHIVED">📦 已归档 (Archived)</option>
              </select>
            </div>
          </div>

          {/* Budget */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                项目预算金额 (元)
              </label>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                可选 · 支出上限控制
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-bold font-mono">
                ¥
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="例如：50000.00"
                className="w-full pl-7 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              可设定项目支出预算上限，用于监控项目支出进度与超支预警（项目收入将按实际记入的收入明细汇总）。
            </p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                开始日期
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                预期结束 / 结项日期
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Theme Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              项目主题颜色
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-xl transition-all flex items-center justify-center ${
                    color === c ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              项目描述
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例如：主卧次卧硬装工程与定制柜体采购，控制总费用并记录各批次材料支出..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            {isEditing && onDelete ? (
              isConfirmingDelete ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 text-xs font-bold pr-1">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>不可逆操作警示</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setStatus('ARCHIVED');
                        setIsConfirmingDelete(false);
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-1 shadow-2xs"
                      title="改为归档安全保存"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>改为归档 (推荐)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(initialProject!.id);
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>确认彻底删除</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className="px-2 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStatus(status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED');
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                      status === 'ARCHIVED'
                        ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                        : 'text-amber-700 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/60 hover:bg-amber-100'
                    }`}
                    title={status === 'ARCHIVED' ? '取消归档恢复为进行中' : '快速将项目归档'}
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>{status === 'ARCHIVED' ? '取消归档' : '归档此项目'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>删除此项目</span>
                  </button>
                </div>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                <span>{isEditing ? '保存修改' : '立即创建'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
