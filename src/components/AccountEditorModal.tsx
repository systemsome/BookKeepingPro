import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Search,
  Trash2,
  Check,
  Sparkles,
  CreditCard,
  Building2,
  Palette,
  Layers,
  Calendar,
  User,
  Wand2,
  Dices,
  RotateCcw,
  RefreshCw,
  Image as ImageIcon,
  SunMoon,
  Coins,
  ChevronRight,
  ExternalLink,
  Info,
  DollarSign,
  Wallet,
  ShieldCheck,
  Upload,
  Loader2,
} from 'lucide-react';
import { FinancialAccount, AccountCategory, BankAccountClass } from '../types';
import { ACCOUNT_CATEGORY_CONFIG } from '../lib/constants';
import {
  BANK_BRANDS,
  CARD_SKINS,
  detectBrandInfo,
  BankBrandInfo,
  autoGenerateCardBackground,
  getRandomCardBackground,
  LUXURY_PALETTES,
  LuxuryPalette,
  getDefaultPresetForCategory,
  getBrandsForCategory,
  COMMON_CARD_TIERS,
  DEBIT_CARD_TIERS,
  CARD_NETWORK_TIERS,
  BANK_ACCOUNT_CLASSES,
  getTiersForContext,
  getTierTheme,
} from '../lib/brandHelper';
import {
  CARDENTIFY_PRESETS,
  CardFacePreset,
  matchBestCardentifyPreset,
  matchBestCardentifyCard,
} from '../lib/cardentifyPresets';
import { CardentifyGalleryModal } from './CardentifyGalleryModal';
import {
  fetchLiveGoldRate,
  getCachedGoldRate,
  GoldMarketRate,
} from '../lib/goldRates';
import { AccountCardFace } from './AccountCardFace';
import { BrandLogo, CardNetworkBadge } from './BrandLogo';
import { matchLogoHubBank } from '../lib/logohubData';
import { compressImageToDataUrl } from './ProjectLogo';

interface AccountEditorModalProps {
  initialAccount?: FinancialAccount | null;
  defaultCategory?: AccountCategory;
  onClose: () => void;
  onSave: (account: FinancialAccount) => void;
  onDelete?: (accountId: string) => void;
}

export const AccountEditorModal: React.FC<AccountEditorModalProps> = ({
  initialAccount,
  defaultCategory = 'DEBIT_CARD',
  onClose,
  onSave,
  onDelete,
}) => {
  const isEdit = !!initialAccount;

  // Form Fields
  const [category, setCategory] = useState<AccountCategory>(
    initialAccount?.category || defaultCategory
  );
  const [name, setName] = useState(initialAccount?.name || '');
  const [bankName, setBankName] = useState(initialAccount?.bankName || '');
  const [bankLogoUrl, setBankLogoUrl] = useState<string>(
    initialAccount?.bankLogoUrl || matchLogoHubBank(initialAccount?.bankName || initialAccount?.name)?.logoUrl || ''
  );
  const [selectedBrandId, setSelectedBrandId] = useState<string>(() => {
    const bName = initialAccount?.bankName || '';
    const accName = initialAccount?.name || '';
    const matched = BANK_BRANDS.find(
      (b) => b.shortName === bName || (b.shortName && accName.includes(b.shortName))
    );
    return matched ? matched.id : '';
  });
  const [cardNumberLast4, setCardNumberLast4] = useState(initialAccount?.cardNumberLast4 || '');
  const [accountClass, setAccountClass] = useState<BankAccountClass>(
    initialAccount?.accountClass || 'CLASS_1'
  );
  const [holderName, setHolderName] = useState(initialAccount?.holderName || '');
  const [cardTier, setCardTier] = useState(initialAccount?.cardTier || '');
  const [cardSkin, setCardSkin] = useState(initialAccount?.cardSkin || '');
  const [cardBgColor, setCardBgColor] = useState(initialAccount?.cardBgColor || '');
  const [cardPattern, setCardPattern] = useState(initialAccount?.cardPattern || 'radial-sheen');
  const [cardTextColor, setCardTextColor] = useState<'light' | 'dark'>(initialAccount?.cardTextColor || 'light');
  const [cardImageUrl, setCardImageUrl] = useState(initialAccount?.cardImageUrl || '');
  const [localCardImageFileName, setLocalCardImageFileName] = useState<string>(() => {
    if (initialAccount?.cardImageUrl?.startsWith('data:')) {
      return '已保存的本地卡面';
    }
    return '';
  });
  const [isUploadingCardImage, setIsUploadingCardImage] = useState(false);
  const [cardImageUploadError, setCardImageUploadError] = useState<string | null>(null);
  const cardImageFileInputRef = useRef<HTMLInputElement>(null);
  const [cardPresetId, setCardPresetId] = useState(initialAccount?.cardPresetId || '');
  const [cardExpiry, setCardExpiry] = useState(initialAccount?.cardExpiry || '');
  const [showBrandLogo, setShowBrandLogo] = useState<boolean>(initialAccount?.showBrandLogo || false);
  const [cardNetwork, setCardNetwork] = useState<'UNIONPAY' | 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'NONE'>(
    initialAccount?.cardNetwork || 'UNIONPAY'
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDraggingOverCard, setIsDraggingOverCard] = useState<boolean>(false);

  // Financial fields
  const [balance, setBalance] = useState<string>(
    initialAccount?.balance !== undefined ? initialAccount.balance.toString() : ''
  );
  const [creditLimit, setCreditLimit] = useState<string>(
    initialAccount?.creditLimit !== undefined ? initialAccount.creditLimit.toString() : ''
  );
  const [usedCredit, setUsedCredit] = useState<string>(
    initialAccount?.usedCredit !== undefined ? initialAccount.usedCredit.toString() : ''
  );
  const [billDay, setBillDay] = useState<string>(
    initialAccount?.billDay !== undefined ? initialAccount.billDay.toString() : ''
  );
  const [dueDay, setDueDay] = useState<string>(
    initialAccount?.dueDay !== undefined ? initialAccount.dueDay.toString() : ''
  );
  const [goldGrams, setGoldGrams] = useState<string>(
    initialAccount?.goldGrams !== undefined ? initialAccount.goldGrams.toString() : ''
  );
  const [goldUnitPrice, setGoldUnitPrice] = useState<string>(
    initialAccount?.goldUnitPrice !== undefined ? initialAccount.goldUnitPrice.toString() : ''
  );
  const [counterparty, setCounterparty] = useState(initialAccount?.counterparty || '');
  const [dueDate, setDueDate] = useState(initialAccount?.dueDate || '');
  const [notes, setNotes] = useState(initialAccount?.notes || '');
  const [color, setColor] = useState(
    initialAccount?.color || ACCOUNT_CATEGORY_CONFIG[category]?.defaultColor || '#2563eb'
  );

  const [autoGenMsg, setAutoGenMsg] = useState<string>('');
  const [brandFilterTab, setBrandFilterTab] = useState<'RECOMMENDED' | 'BANKS' | 'DIGITAL' | 'CREDIT' | 'ALL'>('RECOMMENDED');
  const [liveGoldRate, setLiveGoldRate] = useState<GoldMarketRate>(() => getCachedGoldRate());
  const [isFetchingGold, setIsFetchingGold] = useState<boolean>(false);
  const [isCardentifyGalleryOpen, setIsCardentifyGalleryOpen] = useState<boolean>(false);

  // Auto fetch latest gold market price
  useEffect(() => {
    let isMounted = true;
    fetchLiveGoldRate().then((rate) => {
      if (isMounted) {
        setLiveGoldRate(rate);
        if (!isEdit && category === 'GOLD' && (!goldUnitPrice || goldUnitPrice === '600')) {
          setGoldUnitPrice(rate.priceRmbGram.toString());
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [category, isEdit]);

  // Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleRefreshGoldRate = async () => {
    setIsFetchingGold(true);
    try {
      const rate = await fetchLiveGoldRate(true);
      setLiveGoldRate(rate);
      setGoldUnitPrice(rate.priceRmbGram.toString());
      setAutoGenMsg(`⚡ 已获取今日最新国内 Au9999 金价 ¥${rate.priceRmbGram}/克并自动填入`);
      setTimeout(() => setAutoGenMsg(''), 4000);
    } finally {
      setIsFetchingGold(false);
    }
  };

  // Process and load local card image file
  const processCardImageFile = async (file: File) => {
    if (!file) return;
    setIsUploadingCardImage(true);
    setCardImageUploadError(null);
    try {
      if (file.size > 20 * 1024 * 1024) {
        throw new Error('图片文件过大，请选择小于 20MB 的卡面图片');
      }
      const dataUrl = await compressImageToDataUrl(file, 1024, 0.9);
      setCardImageUrl(dataUrl);
      setCardPresetId('');
      setLocalCardImageFileName(file.name);
      setAutoGenMsg(`🖼️ 已成功导入本地卡面: ${file.name}`);
      setTimeout(() => setAutoGenMsg(''), 3500);
    } catch (err: any) {
      console.error('Failed to load local card image:', err);
      setCardImageUploadError(err.message || '图片读取失败，请检查文件格式后重试');
    } finally {
      setIsUploadingCardImage(false);
    }
  };

  const handleLocalCardImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processCardImageFile(file);
    }
    e.target.value = '';
  };

  const handleCardImageDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverCard(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processCardImageFile(file);
    }
  };

  // Intelligent Auto-select Card Face based on Card Tier & Bank & Network
  const applyCardTierAndFace = (
    newTier: string,
    targetBank?: string,
    targetName?: string,
    targetCategory?: AccountCategory,
    targetNetwork?: 'UNIONPAY' | 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'NONE'
  ) => {
    const effectiveBank = targetBank !== undefined ? targetBank : bankName;
    const effectiveCategory = targetCategory !== undefined ? targetCategory : category;
    const effectiveName = targetName !== undefined ? targetName : (name || `${effectiveBank || ''}${newTier}`);
    const effectiveNetwork = targetNetwork !== undefined ? targetNetwork : cardNetwork;

    setCardTier(newTier);

    // 1. Try to match the best authentic Cardentify & CardArt card face based on bank + name + category + tier!
    const matchedCard = matchBestCardentifyCard(
      effectiveName,
      effectiveBank,
      effectiveCategory,
      newTier,
      effectiveNetwork
    );

    if (matchedCard) {
      const presetId = String(matchedCard.id).startsWith('card')
        ? String(matchedCard.id)
        : `cardentify-${matchedCard.id}`;

      setCardPresetId(presetId);
      setCardImageUrl(matchedCard.imageUrl);

      let net: 'UNIONPAY' | 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'NONE' =
        effectiveNetwork && effectiveNetwork !== 'NONE' ? effectiveNetwork : 'UNIONPAY';

      if (!effectiveNetwork || effectiveNetwork === 'NONE') {
        const brandUp = (matchedCard.brand || '').toUpperCase();
        if (brandUp.includes('VISA')) net = 'VISA';
        else if (brandUp.includes('MASTER')) net = 'MASTERCARD';
        else if (brandUp.includes('AMEX') || brandUp.includes('AMERICAN')) net = 'AMEX';
        else if (brandUp.includes('JCB')) net = 'JCB';
        else if (brandUp.includes('UNIONPAY') || brandUp.includes('银联')) net = 'UNIONPAY';
      }
      setCardNetwork(net);

      const brandInfo = detectBrandInfo(effectiveName, effectiveBank, effectiveCategory);
      const tierTheme = getTierTheme(newTier, brandInfo, net);
      setCardSkin(tierTheme.cardSkin);
      setCardPattern(tierTheme.cardPattern);
      setCardTextColor(tierTheme.cardTextColor);
      setCardBgColor('');

      setAutoGenMsg(`✨ 已根据「${newTier}」智能联动「${matchedCard.name}」高清卡面`);
      setTimeout(() => setAutoGenMsg(''), 4000);
      return;
    }

    // 2. If no exact HD card face image exists, clear previous card face image and apply tier-specific luxury skin & gradient
    setCardPresetId('');
    setCardImageUrl('');
    const brandInfo = detectBrandInfo(effectiveName, effectiveBank, effectiveCategory);
    const tierTheme = getTierTheme(newTier, brandInfo, effectiveNetwork);

    setCardSkin(tierTheme.cardSkin);
    setCardBgColor(tierTheme.cardBgColor);
    setCardPattern(tierTheme.cardPattern);
    setCardTextColor(tierTheme.cardTextColor);
    if (effectiveNetwork && effectiveNetwork !== 'NONE') {
      setCardNetwork(effectiveNetwork);
    }
  };

  // Quick brand preset selection
  const handleSelectBrandPreset = (brand: BankBrandInfo, logoUrl?: string) => {
    setSelectedBrandId(brand.id);
    setBankName(brand.shortName);

    // Update name to reflect newly chosen brand (replace previous bank name if present)
    const suffix = category === 'CREDIT_CARD' ? '信用卡' : category === 'DEBIT_CARD' ? '借记卡' : '';
    const otherBrand = BANK_BRANDS.find((b) => b.id !== brand.id && (name.includes(b.shortName) || name.includes(b.name)));
    if (!name || name === '借记卡' || name === '信用卡' || name === '银行账户' || name === '账户' || otherBrand) {
      setName(brand.name + (suffix && !brand.name.includes(suffix) ? suffix : ''));
    }

    if (logoUrl) {
      setBankLogoUrl(logoUrl);
    }

    // Set Card Network
    let net: 'UNIONPAY' | 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'NONE' = brand.cardNetwork || 'UNIONPAY';
    if (brand.id === 'AMEX') net = 'AMEX';
    else if (brand.id === 'JCB') net = 'JCB';
    else if (
      brand.id === 'ALIPAY' || brand.id === 'WECHAT' || brand.id === 'YUEBAO' ||
      brand.id === 'HUABEI' || brand.id === 'JD_FINANCE' || brand.id === 'JD_BAITIAO' ||
      brand.id === 'CASH' || brand.id === 'GOLD' || brand.id === 'FUND' ||
      brand.id === 'RECEIVABLE' || brand.id === 'PAYABLE'
    ) {
      net = 'NONE';
    }
    setCardNetwork(net);

    // Apply Tier Theme & matching Cardentify card face
    const targetTier =
      category === 'CREDIT_CARD'
        ? (brand.defaultTier?.includes('白金') ? brand.defaultTier : (cardTier || '白金卡'))
        : (brand.defaultTier || cardTier || '金卡');
    setCardTier(targetTier);
    applyCardTierAndFace(targetTier, brand.shortName, brand.name, category, net);
  };

  // Category change handler
  const handleCategoryChange = (newCat: AccountCategory) => {
    setCategory(newCat);
    setSelectedBrandId('');
    setColor(ACCOUNT_CATEGORY_CONFIG[newCat]?.defaultColor || '#2563eb');

    if (!isEdit) {
      const preset = getDefaultPresetForCategory(newCat);
      setName(preset.name);
      setBankName(preset.bankName);
      setBankLogoUrl(preset.bankLogoUrl || '');
      setCardTier(preset.cardTier || '');
      setCardSkin(preset.cardSkin || '');
      setCardBgColor('');
      setCardPattern('radial-sheen');
      setCardTextColor('light');
      setCardNetwork(preset.cardNetwork || 'UNIONPAY');

      // Auto match best Cardentify card for the new category preset!
      const bestCard = matchBestCardentifyCard(preset.name, preset.bankName, newCat, preset.cardTier);
      if (bestCard) {
        setCardImageUrl(bestCard.imageUrl);
        setCardPresetId(String(bestCard.id).startsWith('card') ? String(bestCard.id) : `cardentify-${bestCard.id}`);
      } else {
        setCardImageUrl('');
        setCardPresetId('');
      }
    }
  };

  // Smart background generator
  const handleAutoGenerateBackground = () => {
    const cardInput = name || bankName || ACCOUNT_CATEGORY_CONFIG[category]?.label || '银行卡';
    const bgResult = autoGenerateCardBackground(cardInput);
    setCardBgColor(bgResult.gradient);
    setCardImageUrl('');
    setCardPresetId('');
    setAutoGenMsg(`✨ 已根据「${cardInput}」智能生成高对比度奢华渐变卡面`);
    setTimeout(() => setAutoGenMsg(''), 3500);
  };

  // Random Luxury Background
  const handleRandomBackground = () => {
    const bgPalette = getRandomCardBackground();
    setCardBgColor(bgPalette.gradient);
    setCardImageUrl('');
    setCardPresetId('');
    setAutoGenMsg(`🎲 已随机应用下一款奢华灵感配色: ${bgPalette.name}`);
    setTimeout(() => setAutoGenMsg(''), 3000);
  };

  // Reset to default skin
  const handleResetToDefaultSkin = () => {
    setCardImageUrl('');
    setCardPresetId('');
    setCardBgColor('');
    const brandInfo = detectBrandInfo(name, bankName, category);
    const tierVal = typeof cardTier === 'string' ? cardTier : (cardTier as any)?.value || (cardTier as any)?.label || '标准卡';
    const tierTheme = getTierTheme(tierVal, brandInfo, cardNetwork);
    setCardSkin(tierTheme.cardSkin);
    setCardPattern(tierTheme.cardPattern);
    setCardTextColor(tierTheme.cardTextColor);
    setAutoGenMsg('↺ 已清除自定义底图，恢复官方默认质感底色');
    setTimeout(() => setAutoGenMsg(''), 3000);
  };

  // Available Tiers for this Context
  const availableTiers = useMemo(() => {
    return getTiersForContext(category, cardNetwork);
  }, [category, cardNetwork]);

  // Live Preview Account Object
  const previewAccount: FinancialAccount = useMemo(() => {
    const parsedBalance = parseFloat(balance) || 0;
    const parsedLimit = parseFloat(creditLimit) || 0;
    const parsedUsed = parseFloat(usedCredit) || 0;
    const grams = parseFloat(goldGrams) || 0;
    const unitPrice = parseFloat(goldUnitPrice) || liveGoldRate.priceRmbGram;
    const calcGoldVal = category === 'GOLD' ? Number((grams * unitPrice).toFixed(2)) : parsedBalance;

    return {
      id: initialAccount?.id || 'preview-temp-account',
      name: name || '新资产账户',
      category,
      bankName: bankName || undefined,
      bankLogoUrl: bankLogoUrl || undefined,
      cardNumberLast4: cardNumberLast4 || undefined,
      balance: category === 'GOLD' ? calcGoldVal : parsedBalance,
      creditLimit: category === 'CREDIT_CARD' || category === 'JD_BAITIAO' ? parsedLimit : undefined,
      usedCredit: category === 'CREDIT_CARD' || category === 'JD_BAITIAO' ? parsedUsed : undefined,
      billDay: billDay ? parseInt(billDay, 10) : undefined,
      dueDay: dueDay ? parseInt(dueDay, 10) : undefined,
      color,
      accountClass: category === 'DEBIT_CARD' ? accountClass : undefined,
      holderName: holderName || undefined,
      cardTier: cardTier || undefined,
      cardSkin: cardSkin || undefined,
      cardBgColor: cardBgColor || undefined,
      cardPattern: cardPattern || undefined,
      cardTextColor: cardTextColor || 'light',
      cardImageUrl: cardImageUrl || undefined,
      cardPresetId: cardPresetId || undefined,
      cardExpiry: cardExpiry || undefined,
      showBrandLogo,
      cardNetwork: cardNetwork || 'UNIONPAY',
      goldGrams: category === 'GOLD' ? grams : undefined,
      goldUnitPrice: category === 'GOLD' ? unitPrice : undefined,
      counterparty: category === 'RECEIVABLE' || category === 'PAYABLE' ? counterparty : undefined,
      dueDate: category === 'RECEIVABLE' || category === 'PAYABLE' ? dueDate : undefined,
      notes: notes || undefined,
      updatedAt: new Date().toISOString(),
    };
  }, [
    initialAccount,
    name,
    category,
    bankName,
    bankLogoUrl,
    cardNumberLast4,
    balance,
    creditLimit,
    usedCredit,
    billDay,
    dueDay,
    color,
    accountClass,
    holderName,
    cardTier,
    cardSkin,
    cardBgColor,
    cardPattern,
    cardTextColor,
    cardImageUrl,
    cardPresetId,
    cardExpiry,
    showBrandLogo,
    cardNetwork,
    goldGrams,
    goldUnitPrice,
    liveGoldRate,
    counterparty,
    dueDate,
    notes,
  ]);

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalBalance = parseFloat(balance) || 0;
    if (category === 'GOLD') {
      const grams = parseFloat(goldGrams) || 0;
      const unitPrice = parseFloat(goldUnitPrice) || liveGoldRate.priceRmbGram;
      finalBalance = Number((grams * unitPrice).toFixed(2));
    }

    const accountData: FinancialAccount = {
      id: initialAccount ? initialAccount.id : `acc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      category,
      bankName: bankName.trim() || undefined,
      bankLogoUrl: bankLogoUrl.trim() || undefined,
      cardNumberLast4: cardNumberLast4.trim() || undefined,
      balance: finalBalance,
      creditLimit:
        category === 'CREDIT_CARD' || category === 'JD_BAITIAO'
          ? parseFloat(creditLimit) || 0
          : undefined,
      usedCredit:
        category === 'CREDIT_CARD' || category === 'JD_BAITIAO'
          ? parseFloat(usedCredit) || 0
          : undefined,
      billDay: billDay ? parseInt(billDay, 10) : undefined,
      dueDay: dueDay ? parseInt(dueDay, 10) : undefined,
      color,
      accountClass: category === 'DEBIT_CARD' ? accountClass : undefined,
      holderName: holderName.trim() || undefined,
      cardTier: cardTier.trim() || undefined,
      cardSkin: cardSkin || undefined,
      cardBgColor: cardBgColor.trim() || undefined,
      cardPattern: cardPattern || undefined,
      cardTextColor: cardTextColor || 'light',
      cardImageUrl: cardImageUrl.trim() || undefined,
      cardPresetId: cardPresetId || undefined,
      cardExpiry: cardExpiry.trim() || undefined,
      showBrandLogo,
      cardNetwork: cardNetwork || 'UNIONPAY',
      goldGrams: category === 'GOLD' ? parseFloat(goldGrams) || 0 : undefined,
      goldUnitPrice: category === 'GOLD' ? parseFloat(goldUnitPrice) || liveGoldRate.priceRmbGram : undefined,
      counterparty: category === 'RECEIVABLE' || category === 'PAYABLE' ? counterparty.trim() : undefined,
      dueDate: category === 'RECEIVABLE' || category === 'PAYABLE' ? dueDate : undefined,
      notes: notes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    onSave(accountData);
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[94vh] sm:max-h-[92vh] overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="shrink-0 px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: ACCOUNT_CATEGORY_CONFIG[category]?.defaultColor || '#2563eb' }}
            >
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {isEdit ? '编辑资产账户与卡面' : '添加新卡面与账户'}
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {ACCOUNT_CATEGORY_CONFIG[category]?.label || '银行卡'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                实时拟真 Apple Wallet 质感卡面 · 联动 CardArt & Cardentify 10,950+ 款高清卡面
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              aria-label="关闭窗口 (Esc)"
              title="关闭窗口 (Esc)"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Studio Content Area (2-column layout on Desktop) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Toast Notification */}
          {autoGenMsg && (
            <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{autoGenMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setAutoGenMsg('')}
                className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 ml-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick Bank & Brand Bar */}
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>一键套用机构徽标与官方卡面</span>
              </label>

              {/* Brand categories */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setBrandFilterTab('RECOMMENDED')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                    brandFilterTab === 'RECOMMENDED'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  🌟 分类精选
                </button>
                <button
                  type="button"
                  onClick={() => setBrandFilterTab('BANKS')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                    brandFilterTab === 'BANKS'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  🏦 商业银行
                </button>
                <button
                  type="button"
                  onClick={() => setBrandFilterTab('DIGITAL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                    brandFilterTab === 'DIGITAL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  📱 移动支付
                </button>
                <button
                  type="button"
                  onClick={() => setBrandFilterTab('CREDIT')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                    brandFilterTab === 'CREDIT'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  💳 消费信贷
                </button>
                <button
                  type="button"
                  onClick={() => setBrandFilterTab('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                    brandFilterTab === 'ALL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  📋 全部品牌
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {getBrandsForCategory(category, brandFilterTab).map((b) => {
                const isSelected = selectedBrandId
                  ? selectedBrandId === b.id
                  : bankName === b.shortName;
                const logoUrl =
                  (b.id === 'JD_BAITIAO' ? b.bankLogoUrl : null) ||
                  (b.id === 'YUEBAO' ? 'https://logohub.afengblog.com/logos/library/svglogo/pay/yuebao.svg' : '') ||
                  b.bankLogoUrl ||
                  matchLogoHubBank(b.name)?.logoUrl ||
                  matchLogoHubBank(b.shortName)?.logoUrl ||
                  matchLogoHubBank(b.id)?.logoUrl;

                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSelectBrandPreset(b, logoUrl)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 border transition-all ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs ring-2 ring-blue-500/30'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <BrandLogo type={b.logoType} logoUrl={logoUrl} size="sm" className="w-5.5 h-5.5 shrink-0" />
                    <span>{b.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2-Column Responsive Studio Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT: Form & Configuration (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Quick Section Anchor Bar (居中且左右对称排版) */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 p-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs overflow-x-auto scrollbar-none shadow-2xs">
                <button
                  type="button"
                  onClick={() => document.getElementById('sec-basic')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="px-3 py-1.5 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
                >
                  <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                  <span>基础信息与卡面形象</span>
                </button>
                <span className="text-slate-300 dark:text-slate-600 font-bold select-none px-0.5">·</span>
                <button
                  type="button"
                  onClick={() => document.getElementById('sec-finance')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="px-3 py-1.5 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-emerald-600 dark:hover:text-emerald-400 hover:shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <span>财务金额与额度设置</span>
                </button>
                <span className="text-slate-300 dark:text-slate-600 font-bold select-none px-0.5">·</span>
                <button
                  type="button"
                  onClick={() => document.getElementById('sec-cardface')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="px-3 py-1.5 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-purple-600 dark:hover:text-purple-400 hover:shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                  <span>卡面图像与外观</span>
                </button>
              </div>

              <form id="account-editor-form" onSubmit={handleSubmit} className="space-y-6">
                {/* 基础信息与卡面形象 */}
                <div id="sec-basic" className="space-y-3.5 scroll-mt-4">
                  <div className="flex items-center gap-2 pb-1 text-slate-900 dark:text-white font-bold text-xs sm:text-sm border-b border-slate-100 dark:border-slate-800">
                    <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>基础信息与卡面形象</span>
                  </div>
                    {/* Category Selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          资产大类
                        </label>
                        <select
                          id="acc-select-category"
                          value={category}
                          onChange={(e) => handleCategoryChange(e.target.value as AccountCategory)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <optgroup label="💳 借记卡">
                            <option value="DEBIT_CARD">银行借记卡 (储蓄卡/活期)</option>
                          </optgroup>
                          <optgroup label="💳 信用卡">
                            <option value="CREDIT_CARD">借贷信用卡 (银行信用卡)</option>
                            <option value="JD_BAITIAO">京东白条 (先用后付)</option>
                            <option value="HUABEI">蚂蚁花呗 (先享后付)</option>
                          </optgroup>
                          <optgroup label="📱 数字钱包">
                            <option value="ALIPAY">支付宝余额 (数字零钱钱包)</option>
                            <option value="WECHAT">微信支付 (微信零钱/零钱通)</option>
                          </optgroup>
                          <optgroup label="📈 理财基金">
                            <option value="YUEBAO">余额宝 (零钱货币基金)</option>
                            <option value="FUND">基金理财 (公募基金/理财组合)</option>
                            <option value="GOLD">黄金理财 (积存金/实物黄金)</option>
                            <option value="JD_FINANCE">京东金融 (京东小金库/理财)</option>
                          </optgroup>
                          <optgroup label="💵 现金">
                            <option value="CASH">现金备用金 (纸币/零钱备用)</option>
                          </optgroup>
                          <optgroup label="🤝 借贷">
                            <option value="RECEIVABLE">借出款项 (待收回债权)</option>
                            <option value="PAYABLE">借入款项 (待偿还债务)</option>
                          </optgroup>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="acc-input-bank" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          所属机构 / 银行名称
                        </label>
                        <input
                          id="acc-input-bank"
                          type="text"
                          value={bankName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBankName(val);
                            const matched = matchLogoHubBank(val);
                            if (matched) setBankLogoUrl(matched.logoUrl);
                          }}
                          placeholder="如 工商银行 / 建设银行 / 招商银行"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>

                    {/* Account Display Name & Cardholder Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          账户卡片显示名称 *
                        </label>
                        <input
                          id="acc-input-name"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="例如: 招行经典白金信用卡"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>持卡人姓名</span>
                        </label>
                        <input
                          type="text"
                          value={holderName}
                          onChange={(e) => setHolderName(e.target.value)}
                          placeholder="如 张伟 / ZHANG WEI"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>

                    {/* Card Organization & Tier Selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                          <span>卡组织徽标</span>
                        </label>
                        <select
                          value={cardNetwork}
                          onChange={(e) => {
                            const newNet = e.target.value as any;
                            setCardNetwork(newNet);
                            applyCardTierAndFace(cardTier || '标准卡', bankName, name, category, newNet);
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="UNIONPAY">🇨🇳 中国银联 (UnionPay)</option>
                          <option value="VISA">🌐 Visa (维萨国际)</option>
                          <option value="MASTERCARD">🔴 万事达卡 (Mastercard)</option>
                          <option value="AMEX">🦅 美国运通 (American Express)</option>
                          <option value="JCB">🇯🇵 JCB (日本国际信用卡)</option>
                          <option value="NONE">无卡组织徽标 (纯色卡面)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          卡片级别 / 卡种
                        </label>
                        <select
                          value={cardTier}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCardTier(val);
                            applyCardTierAndFace(val, bankName, name, category, cardNetwork);
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          {availableTiers.map((t: any) => {
                            const tierVal = typeof t === 'string' ? t : t.value || t.label;
                            const tierLabel = typeof t === 'string' ? t : t.label || t.value;
                            return (
                              <option key={typeof t === 'string' ? t : t.id || t.value} value={tierVal}>
                                {tierLabel}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    {/* Card Number Last 4 & Expiry Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          卡号后 4 位 (用于卡面展示与记账对齐)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                            ••••
                          </span>
                          <input
                            type="text"
                            maxLength={4}
                            value={cardNumberLast4}
                            onChange={(e) => setCardNumberLast4(e.target.value.replace(/\D/g, ''))}
                            placeholder="8888"
                            className="w-full pl-12 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>卡片有效期 (MM/YY)</span>
                        </label>
                        <input
                          type="text"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => {
                            let val = e.target.value.replace(/[^\d/]/g, '');
                            if (val.length === 2 && !val.includes('/') && cardExpiry.length < 2) {
                              val = val + '/';
                            }
                            setCardExpiry(val);
                          }}
                          placeholder="例如: 08/29"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  </div>

                {/* 财务金额与额度设置 */}
                <div id="sec-finance" className="pt-5 border-t border-slate-200/80 dark:border-slate-850 space-y-3.5 scroll-mt-4">
                  <div className="flex items-center gap-2 pb-1 text-slate-900 dark:text-white font-bold text-xs sm:text-sm border-b border-slate-100 dark:border-slate-800">
                    <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>财务金额与额度设置</span>
                  </div>
                    {/* Credit Card Specific Fields */}
                    {category === 'CREDIT_CARD' || category === 'JD_BAITIAO' || category === 'HUABEI' ? (
                      <div className="space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                              信用总额度 (元) *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              value={creditLimit}
                              onChange={(e) => setCreditLimit(e.target.value)}
                              placeholder="例如: 50000"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                              已用信用额度 (待还款欠款) (元)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={usedCredit}
                              onChange={(e) => {
                                const used = e.target.value;
                                setUsedCredit(used);
                                if (creditLimit) {
                                  const lim = parseFloat(creditLimit) || 0;
                                  const u = parseFloat(used) || 0;
                                  setBalance(Math.max(0, lim - u).toString());
                                }
                              }}
                              placeholder="0.00"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-rose-600 dark:text-rose-400"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                              剩余免息可用额度 (元)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={balance}
                              onChange={(e) => setBalance(e.target.value)}
                              placeholder="50000.00"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-emerald-600 dark:text-emerald-400"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                每月账单日
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min={1}
                                  max={31}
                                  value={billDay}
                                  onChange={(e) => setBillDay(e.target.value)}
                                  placeholder="5"
                                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
                                  日
                                </span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                每月还款日
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min={1}
                                  max={31}
                                  value={dueDay}
                                  onChange={(e) => setDueDay(e.target.value)}
                                  placeholder="25"
                                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
                                  日
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : category === 'GOLD' ? (
                      /* Gold Account Specifics */
                      <div className="space-y-3.5">
                        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Coins className="w-5 h-5 text-amber-600" />
                            <div>
                              <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                实时国内 Au9999 黄金牌价
                              </span>
                              <div className="text-sm font-black font-mono text-amber-700 dark:text-amber-300">
                                ¥{liveGoldRate.priceRmbGram} / 克
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRefreshGoldRate}
                            disabled={isFetchingGold}
                            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingGold ? 'animate-spin' : ''}`} />
                            <span>同步今日金价</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                              持有黄金克数 (g) *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              value={goldGrams}
                              onChange={(e) => setGoldGrams(e.target.value)}
                              placeholder="例如: 20"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                              买入均价或计价金价 (元/克)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={goldUnitPrice}
                              onChange={(e) => setGoldUnitPrice(e.target.value)}
                              placeholder={liveGoldRate.priceRmbGram.toString()}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          预计总市值: <strong className="text-amber-600 font-mono text-sm">
                            ¥{((parseFloat(goldGrams) || 0) * (parseFloat(goldUnitPrice) || liveGoldRate.priceRmbGram)).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                          </strong> (系统将自动写入账户现有余额)
                        </div>
                      </div>
                    ) : category === 'RECEIVABLE' || category === 'PAYABLE' ? (
                      /* Lend / Borrow Fields */
                      <div className="space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                              {category === 'RECEIVABLE' ? '借出本金金额 (元) *' : '借入债务本金 (元) *'}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              value={balance}
                              onChange={(e) => setBalance(e.target.value)}
                              placeholder="0.00"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                              {category === 'RECEIVABLE' ? '借款人 (债务人) *' : '出借人 (债权机构) *'}
                            </label>
                            <input
                              type="text"
                              required
                              value={counterparty}
                              onChange={(e) => setCounterparty(e.target.value)}
                              placeholder="如 张伟"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                              约定还款日期
                            </label>
                            <input
                              type="date"
                              value={dueDate}
                              onChange={(e) => setDueDate(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* General Debit Card & Digital Wallet & Cash */
                      <div className="space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                              现有可用余额 (元) *
                            </label>
                            <input
                              id="acc-input-balance"
                              type="number"
                              step="0.01"
                              required
                              value={balance}
                              onChange={(e) => setBalance(e.target.value)}
                              placeholder="0.00"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>

                          {category === 'DEBIT_CARD' && (
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                央行账户功能权限等级
                              </label>
                              <select
                                value={accountClass}
                                onChange={(e) => setAccountClass(e.target.value as BankAccountClass)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none"
                              >
                                  {BANK_ACCOUNT_CLASSES.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                      {cls.label} ({cls.tag})
                                    </option>
                                  ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                {/* 卡面图像与外观设置 (位于财务金额与额度设置下方) */}
                <div id="sec-cardface" className="pt-5 border-t border-slate-200/80 dark:border-slate-850 space-y-3.5 scroll-mt-4">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>当前卡面图像 (支持本地图片上传 / CardArt / Cardentify / 网络直链)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => cardImageFileInputRef.current?.click()}
                        disabled={isUploadingCardImage}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        title="选择本地图片文件"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>本地上传</span>
                      </button>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <button
                        type="button"
                        onClick={() => setIsCardentifyGalleryOpen(true)}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <span>卡面艺廊 &gt;</span>
                      </button>
                    </div>
                  </div>

                  {/* 隐藏的本地图片选择 input */}
                  <input
                    ref={cardImageFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif"
                    className="hidden"
                    onChange={handleLocalCardImageChange}
                  />

                  {/* 图像输入与本地上传操作条 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {cardImageUrl.startsWith('data:') ? (
                        <div className="flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <img
                              src={cardImageUrl}
                              alt="Local card preview"
                              className="w-7 h-4.5 object-cover rounded shadow-2xs border border-indigo-200 dark:border-indigo-700 shrink-0"
                            />
                            <span className="font-semibold text-indigo-900 dark:text-indigo-200 truncate">
                              {localCardImageFileName || '已载入本地高清卡面图片'}
                            </span>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 bg-white dark:bg-indigo-900/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 shrink-0">
                              本地原图
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCardImageUrl('');
                              setLocalCardImageFileName('');
                              setCardPresetId('');
                            }}
                            className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium shrink-0 ml-2"
                          >
                            移除
                          </button>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={cardImageUrl}
                          onChange={(e) => {
                            setCardImageUrl(e.target.value);
                            setLocalCardImageFileName('');
                            setCardPresetId('');
                          }}
                          placeholder="从艺廊选用、粘贴图片直链 (https://...) 或点击右侧本地上传"
                          className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => cardImageFileInputRef.current?.click()}
                        disabled={isUploadingCardImage}
                        className="px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 shrink-0 transition-colors shadow-2xs active:scale-95"
                        title="从本地电脑上传卡面图片"
                      >
                        {isUploadingCardImage ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                        <span>{isUploadingCardImage ? '解析中...' : '本地上传'}</span>
                      </button>

                      {cardImageUrl && !cardImageUrl.startsWith('data:') && (
                        <button
                          type="button"
                          onClick={() => {
                            setCardImageUrl('');
                            setCardPresetId('');
                            setLocalCardImageFileName('');
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0"
                        >
                          清除
                        </button>
                      )}
                    </div>

                    {cardImageUploadError && (
                      <p className="text-xs text-rose-500 font-medium">⚠️ {cardImageUploadError}</p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                      <span>💡 支持本地 PNG / JPG / WebP / SVG，也可直接将图片拖拽至卡面预览区域</span>
                      {cardImageUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setCardImageUrl('');
                            setCardPresetId('');
                            setLocalCardImageFileName('');
                          }}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline"
                        >
                          恢复纯色/渐变卡面
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 文字颜色模式 与 机构矢量 Logo 叠加 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                        <SunMoon className="w-3.5 h-3.5 text-slate-500" />
                        <span>文字颜色模式</span>
                      </label>
                      <select
                        value={cardTextColor}
                        onChange={(e) => setCardTextColor(e.target.value as 'light' | 'dark')}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none"
                      >
                        <option value="light">优雅白金文字 (深色/金属卡面)</option>
                        <option value="dark">极简石墨暗黑 (浅色/纯白卡面)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 self-end">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        显示机构LOGO
                      </span>
                      <input
                        type="checkbox"
                        checked={showBrandLogo}
                        onChange={(e) => setShowBrandLogo(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer shrink-0"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* RIGHT: Live 1:1 Interactive Card Studio (5 cols) */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  <span>1:1 真实卡面实时预览</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  ISO 85.6×53.98mm
                </span>
              </div>

              {/* Renders real realistic Card Face Component */}
              <div
                className="w-full shadow-xl rounded-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 relative"
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingOverCard(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingOverCard(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  setIsDraggingOverCard(false);
                }}
                onDrop={handleCardImageDrop}
              >
                <AccountCardFace account={previewAccount} privacyMode={false} hideActionRow={true} />

                {/* Drag-and-drop indicator overlay: ONLY active when dragging an actual file over the card */}
                {isDraggingOverCard && (
                  <div className="absolute inset-0 z-30 bg-slate-950/75 border-2 border-dashed border-indigo-400 rounded-2xl flex flex-col items-center justify-center text-white text-xs font-bold gap-2 animate-in fade-in duration-150 backdrop-blur-xs pointer-events-none">
                    <Upload className="w-6 h-6 text-indigo-400 animate-bounce" />
                    <span>松开鼠标立即应用卡面</span>
                  </div>
                )}
              </div>

              {/* Quick Card Face Actions: Gallery & Local Upload */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsCardentifyGalleryOpen(true)}
                  className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-98"
                >
                  <Palette className="w-4 h-4" />
                  <span>卡面艺廊</span>
                </button>

                <button
                  type="button"
                  onClick={() => cardImageFileInputRef.current?.click()}
                  disabled={isUploadingCardImage}
                  className="py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-98"
                >
                  {isUploadingCardImage ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  ) : (
                    <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  )}
                  <span>本地上传</span>
                </button>
              </div>

              {/* Quick Color & Generator Actions */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleAutoGenerateBackground}
                  className="py-1.5 px-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center justify-center gap-1 border border-purple-200/70 dark:border-purple-800/70"
                  title="根据卡名自动计算渐变色"
                >
                  <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>智能底色</span>
                </button>

                <button
                  type="button"
                  onClick={handleRandomBackground}
                  className="py-1.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center justify-center gap-1 border border-amber-200/70 dark:border-amber-800/70"
                  title="随机切换下一张奢华底色"
                >
                  <Dices className="w-3.5 h-3.5 text-amber-600" />
                  <span>随机换色</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetToDefaultSkin}
                  className="py-1.5 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700"
                  title="恢复默认卡面底色"
                >
                  <RotateCcw className="w-3 h-3 text-slate-500" />
                  <span>重置</span>
                </button>
              </div>

              {/* Curated Hot Card Carousel */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">精选人气官方卡面</span>
                  <span className="text-[11px] text-slate-400">点击即刻换装</span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {CARDENTIFY_PRESETS.map((p) => {
                    const isSelected = cardImageUrl === p.cardImageUrl || cardPresetId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setCardPresetId(p.id);
                          if (p.cardImageUrl) setCardImageUrl(p.cardImageUrl);
                          setCardBgColor(p.cardStyle.background);
                          setCardPattern(p.cardStyle.patternType || 'radial-sheen');
                          setCardTextColor(p.textColorMode);
                          setCardTier(p.cardTier);
                          setCardNetwork(p.cardNetwork);
                          if (!bankName) setBankName(p.bankName);
                          setAutoGenMsg(`🍎 已应用卡面: 「${p.name}」`);
                          setTimeout(() => setAutoGenMsg(''), 3500);
                        }}
                        className={`p-2 rounded-xl border text-left shrink-0 w-32 transition-all relative overflow-hidden ${
                          isSelected
                            ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-white dark:bg-slate-800 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-white'
                        }`}
                      >
                        <div className="w-full h-11 rounded-lg mb-1.5 relative overflow-hidden bg-slate-900">
                          {p.cardImageUrl ? (
                            <img src={p.cardImageUrl} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full" style={{ background: p.cardStyle.background }} />
                          )}
                        </div>
                        <div className="text-[11px] font-bold text-slate-800 dark:text-white truncate">
                          {p.name}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate font-mono">
                          {p.bankName}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between gap-3 z-20">
          <div>
            {isEdit && onDelete && (
              confirmDelete ? (
                <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-3 py-1.5 rounded-xl">
                  <span className="text-xs text-rose-800 dark:text-rose-200 font-semibold">确定移除此卡片？</span>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(initialAccount.id);
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                  >
                    确定删除
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs border border-slate-200 dark:border-slate-700"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 font-medium text-xs flex items-center gap-1.5 transition-colors border border-rose-200/60 dark:border-rose-800/60 shadow-2xs"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>删除此卡片</span>
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
            >
              取消
            </button>

            <button
              id="btn-save-account"
              type="submit"
              form="account-editor-form"
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{isEdit ? '保存并更新卡面' : '立即创建新账户'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cardentify Official Gallery & Selector Modal */}
      <CardentifyGalleryModal
        isOpen={isCardentifyGalleryOpen}
        onClose={() => setIsCardentifyGalleryOpen(false)}
        currentImageUrl={cardImageUrl}
        defaultBankQuery={bankName || name}
        defaultTier={cardTier}
        onSelectCard={(card) => {
          setCardImageUrl(card.imageUrl);
          const presetId = String(card.id).startsWith('card') ? String(card.id) : `cardentify-${card.id}`;
          setCardPresetId(presetId);
          if (!bankName || bankName === '中国银行' || bankName === '银行账户') {
            setBankName(card.issuerName);
          }
          if (!name || name === '借记卡' || name === '信用卡' || name === '银行账户' || name === '账户') {
            setName(card.name);
          }
          let net: 'UNIONPAY' | 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'NONE' = 'UNIONPAY';
          const brandUp = (card.brand || '').toUpperCase();
          if (brandUp.includes('VISA')) net = 'VISA';
          else if (brandUp.includes('MASTER')) net = 'MASTERCARD';
          else if (brandUp.includes('AMEX')) net = 'AMEX';
          else if (brandUp.includes('JCB')) net = 'JCB';
          setCardNetwork(net);
          setCardTier(card.name.includes('白金') ? '白金卡' : card.name.includes('金卡') ? '金卡' : '标准卡');
          setAutoGenMsg(`🍎 已从卡面艺廊套用原版卡面: 「${card.name}」`);
          setIsCardentifyGalleryOpen(false);
          setTimeout(() => setAutoGenMsg(''), 4000);
        }}
      />
    </div>
  );
};
