// src/app/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Edit2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import confetti from 'canvas-confetti';
import { clsx } from 'clsx';

interface Transaction {
  id: string;
  date: string; // ISO string
  amount: number; // INR
  merchant: string;
  category: string;
  source: 'email' | 'sms' | 'manual';
}

interface CategoryBudget {
  category: string;
  monthlyBudget: number;
  lockedForMonth: boolean;
}

const mockTransactions: Transaction[] = [
  { id: '1', date: '2025-08-05', amount: 1250, merchant: 'Swiggy', category: 'Food', source: 'email' },
  { id: '2', date: '2025-08-06', amount: 890, merchant: 'Zomato', category: 'Food', source: 'sms' },
  { id: '3', date: '2025-08-07', amount: 3499, merchant: 'Myntra', category: 'Shopping', source: 'email' },
  { id: '4', date: '2025-08-08', amount: 450, merchant: 'Uber', category: 'Travel / Fuel', source: 'sms' },
  { id: '5', date: '2025-08-10', amount: 1200, merchant: 'Netflix', category: 'Entertainment', source: 'manual' },
  { id: '6', date: '2025-08-12', amount: 560, merchant: 'Apollo Pharmacy', category: 'Medical', source: 'sms' },
  { id: '7', date: '2025-08-15', amount: 2100, merchant: 'Amazon', category: 'Shopping', source: 'email' },
  { id: '8', date: '2025-08-16', amount: 380, merchant: 'Cafe Coffee Day', category: 'Food', source: 'manual' },
  { id: '9', date: '2025-08-17', amount: 850, merchant: 'Rapido', category: 'Travel / Fuel', source: 'sms' },
];

const initialBudgets: CategoryBudget[] = [
  { category: 'Food',           monthlyBudget: 8000,  lockedForMonth: true },
  { category: 'Entertainment',  monthlyBudget: 4000,  lockedForMonth: false },
  { category: 'Shopping',       monthlyBudget: 12000, lockedForMonth: false },
  { category: 'Travel / Fuel',  monthlyBudget: 6000,  lockedForMonth: false },
  { category: 'Medical',        monthlyBudget: 3000,  lockedForMonth: false },
  { category: 'Other',          monthlyBudget: 5000,  lockedForMonth: false },
];

const formatINR = (value: number) => `₹${value.toLocaleString('en-IN')}`;

export default function MonthlySpendOverview() {
  const [budgets, setBudgets] = useState<CategoryBudget[]>(initialBudgets);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // For the exercise you can assume "current month" is Aug 2025
  const currentMonthDate = new Date(2025, 7, 18); // 18 Aug 2025
  const currentMonth = format(currentMonthDate, 'MMMM yyyy');
  const monthStart = format(new Date(2025, 7, 1), 'd MMM');
  const today = format(currentMonthDate, 'd MMM');

  const totalBudget = budgets.reduce((sum, b) => sum + b.monthlyBudget, 0);
  const totalSpent = mockTransactions.reduce((sum, t) => sum + t.amount, 0);
  const spentPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const getSpentByCategory = (category: string) =>
    mockTransactions
      .filter(t => t.category === category)
      .reduce((sum, t) => sum + t.amount, 0);

  // For analytics card: spend per category
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of mockTransactions) {
      map[t.category] = (map[t.category] || 0) + t.amount;
    }
    const entries = Object.entries(map).map(([category, amount]) => ({
      category,
      amount,
      percentageOfTotal: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
    }));
    entries.sort((a, b) => b.amount - a.amount);
    return entries;
  }, [totalSpent]);

  const maxCategoryAmount = useMemo(
    () => categoryStats.reduce((max, c) => Math.max(max, c.amount), 0),
    [categoryStats]
  );

  // One-time budget edit rule: once saved, lockForMonth = true
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = (category: string) => {
    setBudgets(prev =>
      prev.map(b =>
        b.category === category
          ? { ...b, monthlyBudget: editValue, lockedForMonth: true }
          : b
      )
    );
    setEditingCategory(null);
    showToast(`Budget for ${category} updated & locked for this month!`);
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const CircularProgress = ({ percentage, size = 220 }: { percentage: number; size?: number }) => {
    const radius = size / 2 - 20;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="16"
            fill="none"
            className="text-slate-200 dark:text-slate-800"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="16"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={clsx(
              'transition-all duration-1000 ease-out',
              percentage > 90
                ? 'text-rose-500'
                : percentage > 70
                ? 'text-amber-500'
                : 'text-sky-500'
            )}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {formatINR(totalSpent)}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              of {formatINR(totalBudget)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const CategoryBarChart = () => {
    if (!categoryStats.length || maxCategoryAmount === 0) return null;

    return (
      <div className="backdrop-blur-lg bg-white/90 dark:bg-slate-900/80 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-6 sm:p-7">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Spend Analytics
            </p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Spend by Category
            </p>
          </div>
          <p className="text-xs text-slate-500">
            {categoryStats.length} categories
          </p>
        </div>

        <div className="space-y-4">
          {categoryStats.map((item) => {
            const width = (item.amount / maxCategoryAmount) * 100;
            return (
              <div key={item.category} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {item.category}
                  </span>
                  <span className="text-slate-500">
                    {formatINR(item.amount)} · {item.percentageOfTotal.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Monthly Spend Overview
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-3 text-lg">
              {currentMonth}
            </p>
          </div>

          {/* Row 1: Monthly indicator + distribution chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* Monthly Spend Indicator (Requirement 1) */}
            <div className="backdrop-blur-lg bg-white/90 dark:bg-slate-900/80 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-6 sm:p-10">
              <div className="flex flex-col items-center">
                <CircularProgress percentage={spentPercentage} size={220} />

                <div className="mt-8 text-center">
                  <p className="text-sm text-slate-500 uppercase tracking-wider">
                    Period
                  </p>
                  <p className="text-xl font-semibold text-slate-700 dark:text-slate-300">
                    {monthStart} → {today}
                  </p>
                </div>

                <div className="mt-6 flex flex-col items-center gap-2 text-sm">
                  <span
                    className={clsx(
                      'px-4 py-2 rounded-full font-medium text-xs border',
                      spentPercentage > 90
                        ? 'bg-rose-50 text-rose-700 border-rose-100'
                        : spentPercentage > 70
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    )}
                  >
                    {spentPercentage}% of monthly budget used
                  </span>
                  <p className="text-xs text-slate-500">
                    {formatINR(totalSpent)} spent of {formatINR(totalBudget)}
                  </p>
                </div>
              </div>
            </div>

            {/* Spend distribution across categories (Requirement 1 / 2) */}
            <CategoryBarChart />
          </div>

          {/* Category-wise budget breakdown (Requirement 2 + 3) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget) => {
              const spent = getSpentByCategory(budget.category);
              const percentage =
                budget.monthlyBudget > 0
                  ? Math.round((spent / budget.monthlyBudget) * 100)
                  : 0;
              const isExpanded = expandedCategory === budget.category;
              const transactions = mockTransactions.filter(
                t => t.category === budget.category
              );

              return (
                <div
                  key={budget.category}
                  className={clsx(
                    'backdrop-blur-md bg-white/80 dark:bg-slate-900/70 rounded-2xl shadow-lg',
                    'border border-slate-100 dark:border-slate-800 overflow-hidden',
                    'transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]'
                  )}
                >
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() =>
                      setExpandedCategory(isExpanded ? null : budget.category)
                    }
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                        {budget.category}
                      </h3>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-500">Spent</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-50">
                            {formatINR(spent)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5">
                          <div
                            className={clsx(
                              'h-full rounded-full transition-all duration-700',
                              percentage > 100
                                ? 'bg-rose-500'
                                : percentage > 80
                                ? 'bg-amber-400'
                                : 'bg-gradient-to-r from-sky-500 to-indigo-500'
                            )}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-slate-500">
                          <span>{formatINR(budget.monthlyBudget)} budget</span>
                          <span
                            className={
                              percentage > 100
                                ? 'text-rose-600 font-semibold'
                                : 'text-slate-600 dark:text-slate-300'
                            }
                          >
                            {percentage}% used
                          </span>
                        </div>
                      </div>

                      {/* One-time budget edit rule UI */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                        {editingCategory === budget.category ? (
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) =>
                                setEditValue(Number(e.target.value))
                              }
                              onClick={(e) => e.stopPropagation()}
                              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                              autoFocus
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSave(budget.category);
                              }}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <Check className="w-6 h-6" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCategory(null);
                              }}
                              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition"
                            >
                              <X className="w-6 h-6" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!budget.lockedForMonth) {
                                setEditingCategory(budget.category);
                                setEditValue(budget.monthlyBudget);
                              }
                            }}
                            disabled={budget.lockedForMonth}
                            className={clsx(
                              'w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm',
                              budget.lockedForMonth
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                : 'bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                            )}
                          >
                            {budget.lockedForMonth ? (
                              <>Locked for this month</>
                            ) : (
                              <>
                                <Edit2 className="w-4 h-4" /> Edit budget (once)
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Category transactions (Requirement 2 interaction) */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 px-6 py-5">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                        Recent transactions
                      </p>
                      <div className="space-y-3">
                        {transactions.map((t) => (
                          <div
                            key={t.id}
                            className="flex justify-between items-center text-sm"
                          >
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">
                                {t.merchant}
                              </p>
                              <p className="text-xs text-slate-500">
                                {format(new Date(t.date), 'd MMM')}
                              </p>
                            </div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {formatINR(t.amount)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={clsx(
              'fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl shadow-2xl text-white font-medium z-50',
              'animate-[slide-up_0.3s_ease-out]',
              toast.type === 'success' ? 'bg-slate-900' : 'bg-rose-600'
            )}
          >
            {toast.message}
          </div>
        )}
      </div>
    </>
  );
}
