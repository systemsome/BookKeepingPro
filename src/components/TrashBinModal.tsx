import React, { useState, useMemo } from 'react';
import {
  X,
  Trash2,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  ArchiveRestore,
  Calendar,
  Wallet,
  Search,
  CheckSquare,
  Square,
  ShieldAlert,
} from 'lucide-react';
import { DeletedTransaction, FinancialAccount } from '../types';
import { formatCurrency } from '../lib/formatters';

interface TrashBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  trashList: DeletedTransaction[];
  accounts: FinancialAccount[];
  privacyMode?: boolean;
  onRestore: (txId: string) => void;
  onEmptyTrash: () => void;
  onDeletePermanent?: (txId: string) => void;
  onBatchDeletePermanent?: (txIds: string[]) => void;
  onBatchRestore?: (txIds: string[]) => void;
}

export const TrashBinModal: React.FC<TrashBinModalProps> = ({
  isOpen,
  onClose,
  trashList = [],
  accounts = [],
  privacyMode = false,
  onRestore,
  onEmptyTrash,
  onDeletePermanent,
  onBatchDeletePermanent,
  onBatchRestore,
}) => {
  const [showConfirmEmpty, setShowConfirmEmpty] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered trash items based on search query
  const filteredTrash = useMemo(() => {
    if (!searchQuery.trim()) return trashList;
    const q = searchQuery.toLowerCase().trim();
    return trashList.filter((item) => {
      const tx = item.transaction;
      return (
        (tx.description && tx.description.toLowerCase().includes(q)) ||
        (tx.category && tx.category.toLowerCase().includes(q)) ||
        (tx.merchant && tx.merchant.toLowerCase().includes(q)) ||
        (tx.projectName && tx.projectName.toLowerCase().includes(q)) ||
        (tx.date && tx.date.includes(q))
      );
    });
  }, [trashList, searchQuery]);

  // Selection helpers
  const isAllSelected = filteredTrash.length > 0 && selectedIds.length === filteredTrash.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTrash.map((t) => t.transaction.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Single delete execution
  const handleConfirmSingleDelete = (txId: string) => {
    if (onDeletePermanent) {
      onDeletePermanent(txId);
    }
    setConfirmDeleteId(null);
    setSelectedIds((prev) => prev.filter((id) => id !== txId));
  };

  // Batch delete execution
  const handleExecuteBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (onBatchDeletePermanent) {
      onBatchDeletePermanent(selectedIds);
    } else if (onDeletePermanent) {
      selectedIds.forEach((id) => onDeletePermanent(id));
    }
    setSelectedIds([]);
    setShowBatchDeleteConfirm(false);
  };

  // Batch restore execution
  const handleExecuteBatchRestore = () => {
    if (selectedIds.length === 0) return;
    if (onBatchRestore) {
      onBatchRestore(selectedIds);
    } else {
      selectedIds.forEach((id) => onRestore(id));
    }
    setSelectedIds([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* 1. Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-2xs">
              <ArchiveRestore className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  交易流水回收站
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {trashList.length} 笔记录
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                支持单笔彻底删除、批量永久清理，或一键还原重新核算资产
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {trashList.length > 0 && !showConfirmEmpty && (
              <button
                type="button"
                onClick={() => setShowConfirmEmpty(true)}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
              >
                清空回收站
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Global Empty Trash Confirmation */}
        {showConfirmEmpty && (
          <div className="px-5 sm:px-6 py-3 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-800 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>确定彻底清空所有删除记录？此操作将永久抹除数据，无法找回。</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowConfirmEmpty(false)}
                className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  onEmptyTrash();
                  setShowConfirmEmpty(false);
                  setSelectedIds([]);
                }}
                className="px-3 py-1 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-2xs"
              >
                确认彻底清空
              </button>
            </div>
          </div>
        )}

        {/* 3. Batch Delete Confirmation */}
        {showBatchDeleteConfirm && (
          <div className="px-5 sm:px-6 py-3 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-800 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>确定彻底删除选中的 {selectedIds.length} 笔记录？该操作不可撤销。</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowBatchDeleteConfirm(false)}
                className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-white/60 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchDelete}
                className="px-3 py-1 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-2xs"
              >
                确认删除 ({selectedIds.length})
              </button>
            </div>
          </div>
        )}

        {/* 4. Toolbar: Search & Batch Action Bar */}
        {trashList.length > 0 && (
          <div className="px-5 sm:px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 flex flex-wrap items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索删除的流水备注或商户..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Select All & Batch Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium transition-colors"
              >
                {isAllSelected ? (
                  <CheckSquare className="w-3.5 h-3.5 text-rose-500" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{isAllSelected ? '取消全选' : '全选'}</span>
              </button>

              {selectedIds.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleExecuteBatchRestore}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-xs"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>批量还原 ({selectedIds.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowBatchDeleteConfirm(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>彻底删除 ({selectedIds.length})</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* 5. Content List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5">
          {filteredTrash.length === 0 ? (
            <div className="text-center py-16">
              <Trash2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                {searchQuery ? '没有找到匹配的已删除记录' : '回收站空空如也'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery
                  ? '请尝试更换关键词搜索'
                  : '日常误删的账单流水都会暂存在这里，支持随时还原或彻底销毁'}
              </p>
            </div>
          ) : (
            filteredTrash.map((item) => {
              const tx = item.transaction;
              const acc = accounts.find((a) => a.id === tx.accountId);
              const isExpense = tx.type === 'EXPENSE';
              const isSelected = selectedIds.includes(tx.id);
              const isConfirmingDelete = confirmDeleteId === tx.id;

              return (
                <div
                  key={tx.id}
                  className={`p-3.5 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
                    isSelected
                      ? 'border-rose-400/80 bg-rose-50/20 dark:bg-rose-950/20'
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Left: Checkbox & Info */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleSelectOne(tx.id)}
                      className="mt-1 sm:mt-0 p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      title={isSelected ? '取消勾选' : '勾选此项'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-rose-500" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {/* Badge */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isExpense
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                      }`}
                    >
                      {isExpense ? '支' : '收'}
                    </div>

                    {/* Meta */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-[260px]">
                          {tx.description || tx.category}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                          {tx.category}
                        </span>
                        {tx.projectName && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
                            {tx.projectName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{tx.date}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Wallet className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">{acc?.name || '对应账户'}</span>
                        </span>
                        <span className="text-slate-400/80">
                          删于 {new Date(item.deletedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <span
                      className={`text-sm sm:text-base font-bold font-mono ${
                        isExpense
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isExpense ? '-' : '+'}
                      {formatCurrency(tx.amount, privacyMode)}
                    </span>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/70 p-1 rounded-xl border border-rose-200 dark:border-rose-800 animate-in fade-in duration-150">
                          <span className="text-[11px] text-rose-600 dark:text-rose-300 font-bold px-1">
                            确认永久删除？
                          </span>
                          <button
                            type="button"
                            onClick={() => handleConfirmSingleDelete(tx.id)}
                            className="px-2 py-0.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
                          >
                            确定
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-0.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 rounded-lg"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* 还原按钮 */}
                          <button
                            type="button"
                            onClick={() => onRestore(tx.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800 text-xs font-bold active:scale-95 transition-all shadow-2xs"
                            title="还原至账本并自动计入资产"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>还原</span>
                          </button>

                          {/* 单笔彻底删除按钮 */}
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(tx.id)}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 text-xs font-medium transition-all"
                            title="从回收站彻底删除该笔流水"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">彻底删除</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 6. Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="hidden sm:inline">还原操作将精确恢复资产账户余额与分类收支流水；彻底删除不可找回</span>
            <span className="sm:hidden">支持还原或彻底删除记录</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
