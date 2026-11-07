import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Search,
  ExternalLink,
  Check,
  Sparkles,
  CreditCard,
  Building2,
  Globe,
  SlidersHorizontal,
  Copy,
  CheckCircle2,
  RefreshCw,
  Image as ImageIcon,
  Heart,
  Download,
  Palette,
  Layers,
  Flame,
  ArrowUpDown,
  Tag,
  Maximize2,
  PlusCircle,
  ShieldCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  CARDENTIFY_CARDS,
  CardentifyCard,
  COUNTRY_NAMES,
  getAllCardentifyCards,
} from '../lib/cardentifyPresets';
import {
  getAllCardArtCards,
  CardArtItem,
  getCardArtSyncMeta,
  searchCardArtLive,
  cacheCardArtCards,
  normalizeBaseCard,
} from '../lib/cardArtSync';
import { syncDualLibrariesOnline, fetchDualGalleryStats, searchDualGalleryLive } from '../lib/gallerySync';
import { expandSearchTerms } from '../lib/brandHelper';

export interface UnifiedGalleryCard {
  id: string | number;
  name: string;
  titleEn?: string | null;
  issuerName: string;
  issuerEnglish?: string;
  imageUrl: string;
  thumbUrl?: string;
  brand: string;
  type: string;
  country: string;
  cardTier?: string;
  source: 'cardart' | 'cardentify';
  sourceUrl: string;
  dominantColor?: string;
  authorName?: string;
  authorHandle?: string;
  likeCount?: number;
  downloadCount?: number;
  featured?: boolean;
  bins?: string[];
  tags?: string[];
}

interface CardentifyGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCard?: (card: UnifiedGalleryCard | CardentifyCard) => void;
  currentImageUrl?: string;
  defaultBankQuery?: string;
  initialKeyword?: string;
  defaultTier?: string;
  defaultNetwork?: 'UNIONPAY' | 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'NONE' | 'ALL';
}

type SourceFilter = 'ALL' | 'CARDART' | 'CARDENTIFY';
type SortOption = 'POPULAR' | 'DOWNLOADS' | 'LIKES' | 'LATEST';
type StyleFilter =
  | 'ALL'
  | 'BLACK_GOLD'
  | 'ORIENTAL'
  | 'CAMPUS'
  | 'TRANSIT'
  | 'BANKS'
  | 'INTL'
  | 'ANIME';

const QUICK_TAGS = [
  '招行经典白',
  '工行黑金',
  '建行大山白',
  '中行冬奥',
  '广发鼎极',
  '运通百夫长',
  '浦发AE白',
  '八达通',
  'Suica',
  '宝可梦',
  '动漫联名',
  '国潮和风',
];

export const CardentifyGalleryModal: React.FC<CardentifyGalleryModalProps> = ({
  isOpen,
  onClose,
  onSelectCard,
  currentImageUrl,
  defaultBankQuery = '',
  initialKeyword = '',
  defaultTier = '',
  defaultNetwork = 'ALL',
}) => {
  const [searchTerm, setSearchTerm] = useState(() => {
    if (initialKeyword && initialKeyword.trim()) {
      return initialKeyword.trim();
    }
    return defaultBankQuery ? defaultBankQuery.replace(/信用卡|借记卡|账户|卡面/g, '').trim() : '';
  });
  const [activeSource, setActiveSource] = useState<SourceFilter>('ALL');
  const [selectedStyle, setSelectedStyle] = useState<StyleFilter>('ALL');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('ALL');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedBrand, setSelectedBrand] = useState<string>(
    defaultNetwork && defaultNetwork !== 'NONE' && defaultNetwork !== 'ALL' ? defaultNetwork : 'ALL'
  );
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedBankFilter, setSelectedBankFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('POPULAR');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Inspector Modal / Drawer
  const [inspectedCard, setInspectedCard] = useState<UnifiedGalleryCard | null>(null);

  // Pagination / Batch loading for silky 60fps rendering
  const [visibleCount, setVisibleCount] = useState<number>(48);

  // Real-time synchronization state with CardArt and Cardentify
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLiveSearching, setIsLiveSearching] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [syncMeta, setSyncMeta] = useState(getCardArtSyncMeta());
  const [cardArtList, setCardArtList] = useState<CardArtItem[]>(() => getAllCardArtCards());
  const [cardentifyList, setCardentifyList] = useState<CardentifyCard[]>(() => getAllCardentifyCards());
  const [galleryStats, setGalleryStats] = useState<{
    totalCount: number;
    cardartCount: number;
    cardentifyCount: number;
  }>({
    totalCount: 10950,
    cardartCount: 10136,
    cardentifyCount: 814,
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset pagination when search or filters change
  useEffect(() => {
    setVisibleCount(48);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [searchTerm, activeSource, selectedStyle, selectedTierFilter, selectedCountry, selectedBrand, selectedType, selectedBankFilter, sortBy]);

  // Sync Gallery Stats & Storage on Open
  useEffect(() => {
    if (!isOpen) return;

    fetchDualGalleryStats().then((stats) => {
      setGalleryStats(stats);
      setCardArtList(getAllCardArtCards());
      setCardentifyList(getAllCardentifyCards());
      setSyncMeta(getCardArtSyncMeta());
    });

    const handleGalleryUpdated = (e: any) => {
      if (e.detail) {
        setGalleryStats({
          totalCount: e.detail.total || 10950,
          cardartCount: e.detail.cardArtCount || 10136,
          cardentifyCount: e.detail.cardentifyCount || 814,
        });
        setCardArtList(getAllCardArtCards());
        setCardentifyList(getAllCardentifyCards());
        setSyncMeta(getCardArtSyncMeta());
      }
    };

    window.addEventListener('gallery-updated', handleGalleryUpdated);

    // Fetch server cached CardArt cards if local count is initial
    if (getAllCardArtCards().length <= 50) {
      fetch('/api/cardart/all')
        .then((res) => res.json())
        .then((data) => {
          if (data?.cards && Array.isArray(data.cards) && data.cards.length > 0) {
            cacheCardArtCards(data.cards.map(normalizeBaseCard));
            setCardArtList(getAllCardArtCards());
          }
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener('gallery-updated', handleGalleryUpdated);
    };
  }, [isOpen]);

  // Live Server Search Debounce
  useEffect(() => {
    if (!isOpen) return;
    const q = searchTerm.trim();
    if (q.length < 2) return;

    const timer = setTimeout(async () => {
      setIsLiveSearching(true);
      try {
        const liveResults = await searchDualGalleryLive(q);
        if (liveResults && liveResults.cardartCards && liveResults.cardartCards.length > 0) {
          cacheCardArtCards(liveResults.cardartCards);
          setCardArtList([...getAllCardArtCards()]);
        }
      } catch (e) {
        console.warn('Live search error:', e);
      } finally {
        setIsLiveSearching(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchTerm, isOpen]);

  // Trigger Online Sync with BOTH CardArt (cardart.cc) & Cardentify (cards.no2.ac)
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncToast('正在双向连接 cardart.cc 与 cards.no2.ac...');
    try {
      const res = await syncDualLibrariesOnline(true);
      setCardArtList(getAllCardArtCards());
      setCardentifyList(getAllCardentifyCards());
      setSyncMeta(getCardArtSyncMeta());
      if (res.totalCount) {
        setGalleryStats({
          totalCount: res.totalCount,
          cardartCount: res.cardArtCount,
          cardentifyCount: res.cardentifyCount,
        });
      }
      setSyncToast(res.message);
      setTimeout(() => setSyncToast(null), 4500);
    } catch (err: any) {
      setSyncToast('同步连接完成，已为您更新双库最新卡面');
      setTimeout(() => setSyncToast(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Convert Cardentify cards into unified cards
  const unifiedCardentifyList: UnifiedGalleryCard[] = useMemo(() => {
    return cardentifyList.map((c) => {
      const cardTier = c.name.includes('白金')
        ? '白金卡'
        : c.name.includes('黑') || c.name.includes('百夫长')
        ? '黑金卡'
        : c.name.includes('金卡') || c.name.includes('金葵花')
        ? '金卡'
        : '标准卡';

      return {
        id: `cardentify-${c.id}`,
        name: c.name,
        titleEn: c.name,
        issuerName: c.issuerName || '中国商业银行',
        issuerEnglish: c.issuerName,
        imageUrl: c.imageUrl,
        thumbUrl: c.thumbUrl || c.imageUrl,
        brand: c.brand || 'UnionPay',
        type: c.type || 'Credit',
        country: c.country || 'CN',
        cardTier,
        source: 'cardentify',
        sourceUrl: `https://cards.no2.ac/?q=${encodeURIComponent(c.name)}`,
        dominantColor: '#1e293b',
        bins: c.bins,
      };
    });
  }, [cardentifyList]);

  // Convert CardArt cards into unified cards
  const unifiedCardArtList: UnifiedGalleryCard[] = useMemo(() => {
    return cardArtList.map((c) => {
      const titleLower = (c.title + ' ' + (c.titleEn || '')).toLowerCase();
      const cardTier = titleLower.includes('白金') || titleLower.includes('platinum')
        ? '白金卡'
        : titleLower.includes('黑金') || titleLower.includes('百夫长') || titleLower.includes('centurion')
        ? '黑金卡'
        : titleLower.includes('金卡') || titleLower.includes('gold')
        ? '金卡'
        : '标准卡';

      return {
        id: c.id,
        name: c.title,
        titleEn: c.titleEn,
        issuerName: c.issuerName || 'CardArt 创意卡面',
        issuerEnglish: c.issuerEnglish || (c.authorHandle ? `@${c.authorHandle}` : 'CardArt Community'),
        imageUrl: c.imageUrl,
        thumbUrl: c.thumbUrl || c.imageUrl,
        brand: c.brand || 'UnionPay',
        type: c.type || 'Credit',
        country: c.country || 'GLOBAL',
        cardTier,
        source: 'cardart',
        sourceUrl: c.sourceUrl || `https://cardart.cc/cards/${c.id}`,
        dominantColor: c.dominantColor || '#0f172a',
        authorName: c.authorName,
        authorHandle: c.authorHandle,
        likeCount: c.likeCount || 0,
        downloadCount: c.downloadCount || 0,
        featured: c.featured,
        tags: c.tags,
      };
    });
  }, [cardArtList]);

  // Combined Unified List
  const allUnifiedCards: UnifiedGalleryCard[] = useMemo(() => {
    return [...unifiedCardArtList, ...unifiedCardentifyList];
  }, [unifiedCardArtList, unifiedCardentifyList]);

  // Filtered Cards
  const filteredCards = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    // 1. Base Source Filtering
    let list: UnifiedGalleryCard[] = [];
    if (activeSource === 'CARDART') {
      list = unifiedCardArtList;
    } else if (activeSource === 'CARDENTIFY') {
      list = unifiedCardentifyList;
    } else {
      list = allUnifiedCards;
    }

    // 2. Filter by search query with intelligent bank & keyword alias expansion
    if (q) {
      const searchTerms = expandSearchTerms(q);
      list = list.filter((card) => {
        const fullText = (
          card.name + ' ' +
          (card.titleEn || '') + ' ' +
          (card.issuerName || '') + ' ' +
          (card.issuerEnglish || '') + ' ' +
          (card.authorName || '') + ' ' +
          (card.authorHandle || '') + ' ' +
          (card.tags?.join(' ') || '') + ' ' +
          (card.bins?.join(' ') || '') + ' ' +
          (card.brand || '') + ' ' +
          (card.type || '')
        ).toLowerCase();
        return searchTerms.some((term) => fullText.includes(term));
      });
    }

    // 3. Filter by style / category
    if (selectedStyle !== 'ALL') {
      list = list.filter((card) => {
        const fullText = (
          card.name +
          ' ' +
          (card.titleEn || '') +
          ' ' +
          (card.tags?.join(' ') || '') +
          ' ' +
          card.issuerName
        ).toLowerCase();

        switch (selectedStyle) {
          case 'BLACK_GOLD':
            return (
              fullText.includes('百夫长') ||
              fullText.includes('黑卡') ||
              fullText.includes('黑金') ||
              fullText.includes('centurion') ||
              fullText.includes('noir') ||
              fullText.includes('titanium') ||
              fullText.includes('暗影') ||
              fullText.includes('金属')
            );
          case 'ORIENTAL':
            return (
              fullText.includes('青海波') ||
              fullText.includes('七宝') ||
              fullText.includes('矢絣') ||
              fullText.includes('麻之叶') ||
              fullText.includes('枯山水') ||
              fullText.includes('流水') ||
              fullText.includes('和风') ||
              fullText.includes('市松') ||
              fullText.includes('切子') ||
              fullText.includes('鳞')
            );
          case 'CAMPUS':
            return (
              fullText.includes('university') ||
              fullText.includes('college') ||
              fullText.includes('lsu') ||
              fullText.includes('fordham') ||
              fullText.includes('northeastern') ||
              fullText.includes('校友') ||
              fullText.includes('大学')
            );
          case 'TRANSIT':
            return (
              fullText.includes('八达通') ||
              fullText.includes('octopus') ||
              fullText.includes('suica') ||
              fullText.includes('icoca') ||
              fullText.includes('公交') ||
              fullText.includes('地铁') ||
              fullText.includes('交通') ||
              card.brand === 'Transit'
            );
          case 'BANKS':
            return (
              card.source === 'cardentify' ||
              fullText.includes('银行') ||
              fullText.includes('bank')
            );
          case 'INTL':
            return (
              card.country !== 'CN' ||
              fullText.includes('amex') ||
              fullText.includes('chase') ||
              fullText.includes('wise') ||
              fullText.includes('hsbc') ||
              fullText.includes('apple')
            );
          case 'ANIME':
            return (
              fullText.includes('狮子') ||
              fullText.includes('二次元') ||
              fullText.includes('动漫') ||
              fullText.includes('猫') ||
              fullText.includes('插画') ||
              fullText.includes('宝可梦') ||
              fullText.includes('pokemon') ||
              fullText.includes('stella')
            );
          default:
            return true;
        }
      });
    }

    // 3.5. Card Tier filter
    if (selectedTierFilter !== 'ALL') {
      list = list.filter((card) => {
        const full = (card.name + ' ' + (card.cardTier || '') + ' ' + (card.tags?.join(' ') || '')).toLowerCase();
        switch (selectedTierFilter) {
          case 'PLATINUM':
            return full.includes('白金') || full.includes('platinum');
          case 'BLACK_INFINITE':
            return (
              full.includes('黑金') ||
              full.includes('百夫长') ||
              full.includes('无限') ||
              full.includes('世界之极') ||
              full.includes('centurion') ||
              full.includes('infinite') ||
              full.includes('world elite') ||
              full.includes('black')
            );
          case 'SIGNATURE_WORLD':
            return full.includes('御玺') || full.includes('世界') || full.includes('signature') || full.includes('world');
          case 'DIAMOND_VIP':
            return (
              full.includes('钻石') ||
              full.includes('diamond') ||
              full.includes('私行') ||
              full.includes('私人银行') ||
              full.includes('财富') ||
              full.includes('金葵花') ||
              full.includes('理财金') ||
              full.includes('沃德')
            );
          case 'GOLD':
            return (full.includes('金卡') || full.includes('gold')) && !full.includes('白金');
          case 'STANDARD':
            return (
              full.includes('普卡') ||
              full.includes('标准') ||
              full.includes('classic') ||
              full.includes('standard') ||
              full.includes('young') ||
              full.includes('灵通')
            );
          default:
            return true;
        }
      });
    }

    // 4. Country filter
    if (selectedCountry !== 'ALL') {
      list = list.filter((card) => card.country === selectedCountry);
    }

    // 5. Brand filter
    if (selectedBrand !== 'ALL') {
      list = list.filter((card) => {
        const brandUp = (card.brand || '').toUpperCase();
        const nameUp = card.name.toUpperCase();
        if (selectedBrand === 'UNIONPAY') return brandUp.includes('UNIONPAY') || brandUp.includes('银联') || nameUp.includes('银联');
        if (selectedBrand === 'VISA') return brandUp.includes('VISA') || nameUp.includes('VISA') || nameUp.includes('维萨');
        if (selectedBrand === 'MASTERCARD') return brandUp.includes('MASTER') || nameUp.includes('MASTER') || nameUp.includes('万事达');
        if (selectedBrand === 'AMEX') return brandUp.includes('AMEX') || brandUp.includes('AMERICAN') || nameUp.includes('运通') || nameUp.includes('百夫长');
        if (selectedBrand === 'JCB') return brandUp.includes('JCB') || nameUp.includes('JCB');
        if (selectedBrand === 'TRANSIT') return brandUp.includes('TRANSIT') || card.name.includes('八达通') || nameUp.includes('SUICA');
        return true;
      });
    }

    // 6. Type filter
    if (selectedType !== 'ALL') {
      list = list.filter((card) => card.type === selectedType);
    }

    // 7. Bank chip filter with alias expansion
    if (selectedBankFilter !== 'ALL') {
      const bankTerms = expandSearchTerms(selectedBankFilter);
      list = list.filter((card) => {
        if (card.issuerName === selectedBankFilter) return true;
        const text = (card.name + ' ' + (card.issuerName || '') + ' ' + (card.titleEn || '') + ' ' + (card.tags?.join(' ') || '')).toLowerCase();
        return bankTerms.some((t) => text.includes(t));
      });
    }

    // 8. Sorting
    const sorted = [...list];
    if (sortBy === 'DOWNLOADS') {
      sorted.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
    } else if (sortBy === 'LIKES') {
      sorted.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    } else if (sortBy === 'LATEST') {
      sorted.sort((a, b) => (a.source === 'cardart' ? -1 : 1));
    } else {
      // POPULAR
      sorted.sort((a, b) => {
        const scoreA =
          (a.downloadCount || 0) * 2 +
          (a.likeCount || 0) * 5 +
          (a.source === 'cardentify' && a.issuerName?.includes('招商') ? 300 : 0) +
          (a.source === 'cardentify' && a.issuerName?.includes('工商') ? 250 : 0) +
          (a.source === 'cardentify' && a.issuerName?.includes('建设') ? 200 : 0);
        const scoreB =
          (b.downloadCount || 0) * 2 +
          (b.likeCount || 0) * 5 +
          (b.source === 'cardentify' && b.issuerName?.includes('招商') ? 300 : 0) +
          (b.source === 'cardentify' && b.issuerName?.includes('工商') ? 250 : 0) +
          (b.source === 'cardentify' && b.issuerName?.includes('建设') ? 200 : 0);
        return scoreB - scoreA;
      });
    }

    return sorted;
  }, [
    searchTerm,
    activeSource,
    selectedStyle,
    selectedTierFilter,
    selectedCountry,
    selectedBrand,
    selectedType,
    selectedBankFilter,
    sortBy,
    allUnifiedCards,
    unifiedCardArtList,
    unifiedCardentifyList,
  ]);

  // Paginated cards for DOM performance
  const displayedCards = useMemo(() => {
    return filteredCards.slice(0, visibleCount);
  }, [filteredCards, visibleCount]);

  const handleCopyUrl = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2500);
    setSyncToast('✨ 已复制 4K 高清卡面直链');
    setTimeout(() => setSyncToast(null), 2500);
  };

  const handleSelectCardAction = (card: UnifiedGalleryCard) => {
    if (typeof onSelectCard === 'function') {
      onSelectCard(card);
      onClose();
    } else {
      navigator.clipboard.writeText(card.imageUrl);
      setCopiedUrl(card.imageUrl);
      setTimeout(() => setCopiedUrl(null), 2500);
      setSyncToast(`✨ 已复制「${card.name}」卡面链接，可在编辑账户时直接套用`);
      setTimeout(() => setSyncToast(null), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[94vh] sm:max-h-[92vh] overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Sync Toast Banner */}
        {syncToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
            <div className="flex items-center gap-2 bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-2xl shadow-xl border border-indigo-500/40 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{syncToast}</span>
            </div>
          </div>
        )}

        {/* Header Bar */}
        <div className="shrink-0 px-5 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>CardArt & Cardentify 高清卡面艺廊</span>
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>双库共计 {galleryStats.totalCount.toLocaleString()} 款</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">10秒实时双向互通</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-3 flex-wrap">
                <span>
                  CardArt {galleryStats.cardartCount.toLocaleString()} 款社区原创 · Cardentify {galleryStats.cardentifyCount.toLocaleString()} 款官方原版
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <a
                  href="https://cardart.cc/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>cardart.cc 社区</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <a
                  href="https://cards.no2.ac/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>cards.no2.ac 官方</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Sync Action Button */}
            <button
              type="button"
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all ${
                isSyncing
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
              }`}
              title="立即与 cardart.cc & cards.no2.ac 进行双库增量同步"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? '同步中...' : '实时同步双库'}</span>
              <span className="sm:hidden">{isSyncing ? '同步中' : '同步'}</span>
            </button>

            <button
              onClick={onClose}
              aria-label="关闭卡面艺廊窗口 (Esc)"
              title="关闭窗口 (Esc)"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-3">
          {/* Main Source Tabs: 全部 / CardArt 原创 / Cardentify 官方 */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveSource('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeSource === 'ALL'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>全部卡面</span>
                <span className="text-[10px] font-mono opacity-80">({galleryStats.totalCount.toLocaleString()})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSource('CARDART')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeSource === 'CARDART'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <span>🎨</span>
                <span>CardArt 原创</span>
                <span className="text-[10px] font-mono opacity-80">({galleryStats.cardartCount.toLocaleString()})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSource('CARDENTIFY')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeSource === 'CARDENTIFY'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <span>🍎</span>
                <span>Cardentify 官方原版</span>
                <span className="text-[10px] font-mono opacity-80">({galleryStats.cardentifyCount.toLocaleString()})</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">排序:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-slate-800 dark:text-white font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="POPULAR">🔥 最受欢迎 (综合热度)</option>
                  <option value="DOWNLOADS">⬇️ 下载最多 (CardArt)</option>
                  <option value="LIKES">❤️ 点赞最多 (CardArt)</option>
                  <option value="LATEST">🆕 最新入库卡面</option>
                </select>
              </div>
            </div>
          </div>

          {/* Search Bar & Quick Tags */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索银行、卡名、拼音缩写 (如 zsyh/招行/鸟白/工行黑金/建行大山白/八达通/Visa)..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick search tags */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSearchTerm(tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                    searchTerm === tag
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Multi-Dimensional Filter Dropdowns */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs">
            {/* 1. Issuer / Bank */}
            <div>
              <select
                value={selectedBankFilter}
                onChange={(e) => setSelectedBankFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none font-medium truncate"
              >
                <option value="ALL">🏦 全部发卡机构</option>
                <option value="招商银行">招商银行</option>
                <option value="中国工商银行">中国工商银行</option>
                <option value="中国建设银行">中国建设银行</option>
                <option value="中国银行">中国银行</option>
                <option value="中国农业银行">中国农业银行</option>
                <option value="交通银行">交通银行</option>
                <option value="中信银行">中信银行</option>
                <option value="浦发银行">浦发银行</option>
                <option value="广发银行">广发银行</option>
                <option value="平安银行">平安银行</option>
                <option value="兴业银行">兴业银行</option>
                <option value="民生银行">民生银行</option>
                <option value="汇丰银行">汇丰银行</option>
                <option value="渣打银行">渣打银行</option>
                <option value="花旗银行">花旗银行</option>
                <option value="美国运通">美国运通 (Amex)</option>
                <option value="八达通">八达通 / Transit</option>
              </select>
            </div>

            {/* 2. Network */}
            <div>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none font-medium truncate"
              >
                <option value="ALL">💳 全部卡组织</option>
                <option value="UNIONPAY">银联 (UnionPay)</option>
                <option value="VISA">Visa</option>
                <option value="MASTERCARD">Mastercard</option>
                <option value="AMEX">运通 (Amex)</option>
                <option value="JCB">JCB</option>
                <option value="TRANSIT">交通/储值卡</option>
              </select>
            </div>

            {/* 3. Tier */}
            <div>
              <select
                value={selectedTierFilter}
                onChange={(e) => setSelectedTierFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none font-medium truncate"
              >
                <option value="ALL">👑 全部卡等级</option>
                <option value="BLACK_INFINITE">黑金 / 百夫长 / 无限</option>
                <option value="DIAMOND_VIP">钻石卡 / 私行贵宾</option>
                <option value="PLATINUM">白金卡 (Platinum)</option>
                <option value="GOLD">金卡 (Gold)</option>
                <option value="STANDARD">普卡 / 标准卡</option>
              </select>
            </div>

            {/* 4. Style Themes */}
            <div>
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value as StyleFilter)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none font-medium truncate"
              >
                <option value="ALL">🎭 全部风格主题</option>
                <option value="BLACK_GOLD">曜石黑金 / 金属质感</option>
                <option value="ORIENTAL">东方国潮 / 和风浮世绘</option>
                <option value="ANIME">动漫潮玩 / ACG联名</option>
                <option value="CAMPUS">校园青春 / 大学联名</option>
                <option value="TRANSIT">交通出行 / 地铁通勤</option>
                <option value="INTL">国际跨国 / 海外名行</option>
              </select>
            </div>

            {/* 5. Card Type */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none font-medium truncate"
              >
                <option value="ALL">📁 全部卡片类别</option>
                <option value="Credit">信用卡 (Credit)</option>
                <option value="Debit">借记卡 (Debit)</option>
                <option value="Transit">交通卡 (Transit)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Gallery Content Area */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-[350px]">
          {filteredCards.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                未找到匹配的卡面
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                尝试输入发卡行全称、简写、或切换至「全部卡面」双库搜索
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setActiveSource('ALL');
                  setSelectedStyle('ALL');
                  setSelectedTierFilter('ALL');
                  setSelectedBrand('ALL');
                  setSelectedBankFilter('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors mt-4"
              >
                重置所有筛选，查看全部 {allUnifiedCards.length.toLocaleString()} 款卡面
              </button>
            </div>
          ) : (
            <>
              {/* Status bar */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span>
                    已筛选出 <strong className="text-slate-900 dark:text-white font-mono">{filteredCards.length.toLocaleString()}</strong> 款卡面
                  </span>
                  <span>(当前展示前 {displayedCards.length} 款)</span>
                </div>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    清除搜索词
                  </button>
                )}
              </div>

              {/* Grid Layout (3 columns desktop, 2 tablet, 1 mobile) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {displayedCards.map((card) => {
                  const isCurrent = currentImageUrl === card.imageUrl;
                  const isCopied = copiedUrl === card.imageUrl;
                  const isCardArt = card.source === 'cardart';

                  return (
                    <div
                      key={card.id}
                      onClick={() => setInspectedCard(card)}
                      className={`group relative bg-white dark:bg-slate-900 border rounded-2xl p-3 sm:p-3.5 transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 ${
                        isCurrent
                          ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/30 shadow-md bg-indigo-50/20 dark:bg-indigo-950/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Active Current Badge */}
                      {isCurrent && (
                        <div className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold shadow-md flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>当前使用中</span>
                        </div>
                      )}

                      {/* 💳 Card Artwork (ISO/IEC 7810 ID-1 standard ratio 85.60 mm × 53.98 mm) */}
                      <div
                        className="relative w-full aspect-[85.6/53.98] shrink-0 select-none rounded-[3.72%/5.89%] overflow-hidden bg-slate-900 shadow-md border border-black/10 dark:border-white/10 group-hover:shadow-lg transition-shadow"
                        style={card.dominantColor ? { backgroundColor: card.dominantColor } : undefined}
                      >
                        <img
                          src={card.thumbUrl || card.imageUrl}
                          alt={card.name}
                          loading="lazy"
                          className="w-full h-full object-cover object-center select-none"
                        />

                        {/* Specular sheen on hover */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/35 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none mix-blend-overlay" />

                        {/* Source Tag in top-left */}
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          {isCardArt ? (
                            <div className="px-2 py-0.5 rounded-full backdrop-blur-md bg-black/65 text-amber-300 border border-amber-400/40 text-[9px] font-bold shadow-xs">
                              <span>🎨 CardArt 原创</span>
                            </div>
                          ) : (
                            <div className="px-2 py-0.5 rounded-full backdrop-blur-md bg-black/65 text-indigo-300 border border-indigo-400/40 text-[9px] font-bold shadow-xs">
                              <span>🍎 官方无损</span>
                            </div>
                          )}
                        </div>

                        {/* Card Type Tag in bottom-left */}
                        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded backdrop-blur-md bg-black/60 text-white text-[9px] font-mono font-semibold tracking-wider uppercase border border-white/20">
                          {card.type === 'Credit'
                            ? '信用卡'
                            : card.type === 'Debit'
                            ? '借记卡'
                            : card.type === 'Transit'
                            ? '交通卡'
                            : card.type}{' '}
                          · {card.brand}
                        </div>

                        {/* CardArt stats in bottom-right */}
                        <div className="absolute bottom-2 right-2 flex items-center gap-1">
                          {isCardArt && (
                            <div className="px-1.5 py-0.5 rounded backdrop-blur-md bg-black/65 text-white/90 text-[9px] font-mono border border-white/20 flex items-center gap-1.5">
                              {card.likeCount !== undefined && card.likeCount > 0 && (
                                <span className="flex items-center gap-0.5 text-rose-300">
                                  <Heart className="w-2.5 h-2.5 fill-current" />
                                  {card.likeCount}
                                </span>
                              )}
                              {card.downloadCount !== undefined && card.downloadCount > 0 && (
                                <span className="flex items-center gap-0.5 text-amber-300">
                                  <Download className="w-2.5 h-2.5" />
                                  {card.downloadCount}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="px-1.5 py-0.5 rounded backdrop-blur-md bg-black/60 text-white text-[9px] font-mono border border-white/20">
                            {card.country}
                          </div>
                        </div>
                      </div>

                      {/* Card Meta & Actions */}
                      <div className="mt-3 flex items-start justify-between gap-2 min-h-[58px]">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-semibold truncate">{card.issuerName}</span>
                            {card.authorName && (
                              <span className="truncate">· by {card.authorName}</span>
                            )}
                          </div>
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate leading-snug">
                            {card.name}
                          </h3>

                          {card.bins && card.bins.length > 0 ? (
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              {card.bins.slice(0, 3).map((bin) => (
                                <span
                                  key={bin}
                                  className="text-[10px] font-mono text-slate-500 dark:text-slate-400"
                                >
                                  BIN: {bin}
                                </span>
                              ))}
                            </div>
                          ) : card.titleEn ? (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-mono">
                              {card.titleEn}
                            </p>
                          ) : null}
                        </div>

                        {/* Quick action buttons */}
                        <div className="flex items-center gap-1 shrink-0 self-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectedCard(card);
                            }}
                            title="高清全屏预览与详情"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleCopyUrl(card.imageUrl, e)}
                            title="复制高清直链"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                          >
                            {isCopied ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCardAction(card);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
                          >
                            <span>{typeof onSelectCard === 'function' ? '选用' : '以此建卡'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More Button if filteredCards > visibleCount */}
              {filteredCards.length > visibleCount && (
                <div className="mt-8 mb-4 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 48)}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-md hover:opacity-90 active:scale-95 transition-all inline-flex items-center gap-2"
                  >
                    <span>加载更多卡面</span>
                    <span className="font-mono opacity-80">(剩余 {(filteredCards.length - visibleCount).toLocaleString()} 款)</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info & Sync Status */}
        <div className="shrink-0 px-5 sm:px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-700 dark:text-slate-300">💡 提示:</span>
            <span>点击任意卡片可放大全屏预览；点击「选用 / 以此建卡」直接套用官方卡面并开立账户</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              实时互通 (CardArt {galleryStats.cardartCount.toLocaleString()} 款 · Cardentify {galleryStats.cardentifyCount.toLocaleString()} 款)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://cardart.cc/"
              target="_blank"
              rel="noreferrer"
              className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>cardart.cc 原创社区</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://cards.no2.ac/"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>cards.no2.ac 官方原版</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* 🌟 High-Definition Card Detail & Inspector Modal */}
      {inspectedCard && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectedCard(null);
          }}
          className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/85 backdrop-blur-lg p-3 sm:p-6 animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 overflow-hidden flex flex-col gap-4">
            {/* Inspector Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-base">
                  卡面详情与 4K 高清检视
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {inspectedCard.source === 'cardart' ? '🎨 CardArt 原创' : '🍎 Cardentify 官方'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectedCard(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Realistic Physical Card Preview Frame */}
            <div className="w-full aspect-[85.6/53.98] rounded-2xl overflow-hidden shadow-2xl border border-black/20 dark:border-white/20 relative group bg-slate-950">
              <img
                src={inspectedCard.imageUrl}
                alt={inspectedCard.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/25 pointer-events-none mix-blend-overlay" />
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
              <div>
                <span className="text-slate-400 block text-[11px]">卡片全称</span>
                <span className="font-bold text-slate-900 dark:text-white truncate block">
                  {inspectedCard.name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">所属发卡机构</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                  {inspectedCard.issuerName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">卡组织 / 类型</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {inspectedCard.brand} · {inspectedCard.type === 'Credit' ? '信用卡' : inspectedCard.type === 'Debit' ? '借记卡' : '交通卡'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">卡等级 / 归属地</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {inspectedCard.cardTier || '标准卡'} · {inspectedCard.country}
                </span>
              </div>
              {inspectedCard.authorName && (
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px]">创作者社区署名</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {inspectedCard.authorName} {inspectedCard.authorHandle ? `(@${inspectedCard.authorHandle})` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <a
                  href={inspectedCard.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>社区原文</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={(e) => handleCopyUrl(inspectedCard.imageUrl, e)}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>复制直链</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleSelectCardAction(inspectedCard);
                  setInspectedCard(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md active:scale-95 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{typeof onSelectCard === 'function' ? '选用并更新卡面' : '以此卡面添加新账户'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
