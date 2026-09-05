import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Search, 
  Calendar, 
  Trash2, 
  Edit3, 
  BarChart3,
  PieChart as PieIcon,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  X, 
  Save,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Banknote,
  Filter,
  Target,
  Users,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface Transaction {
  id: string;
  title: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  method: 'cash' | 'bank';
  date: string;
}

interface Budget {
  id: string;
  category: string;
  limit: number;
}

interface SavingGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  deadline: string;
}

interface Debt {
  id: string;
  name: string;
  amount: number;
  type: 'lent' | 'borrowed';
  note: string;
  dueDate: string;
}

const initialTransactions: Transaction[] = [
  { id: '1', title: 'Lương tháng 9', type: 'income', amount: 28000000, category: 'Lương', method: 'bank', date: '2026-09-01' },
  { id: '2', title: 'Tiền nhà trọ tháng 9', type: 'expense', amount: 4500000, category: 'Nhà ở', method: 'bank', date: '2026-09-02' },
  { id: '3', title: 'Ăn uống cuối tuần', type: 'expense', amount: 3500000, category: 'Ăn uống', method: 'cash', date: '2026-09-03' },
  { id: '4', title: 'Đổ xăng xe', type: 'expense', amount: 300000, category: 'Đi lại', method: 'cash', date: '2026-09-04' },
  { id: '5', title: 'Tiền điện nước', type: 'expense', amount: 850000, category: 'Nhà ở', method: 'bank', date: '2026-09-05' },
];

const initialBudgets: Budget[] = [
  { id: '1', category: 'Ăn uống', limit: 4000000 },
  { id: '2', category: 'Nhà ở', limit: 5000000 },
  { id: '3', category: 'Mua sắm', limit: 2000000 },
  { id: '4', category: 'Đi lại', limit: 1000000 },
];

const initialGoals: SavingGoal[] = [
  { id: '1', title: 'Mua Laptop mới', target: 25000000, current: 16500000, deadline: '2026-12-31' },
  { id: '2', title: 'Về quê ăn Tết', target: 5000000, current: 3000000, deadline: '2027-01-20' },
];

const initialDebts: Debt[] = [
  { id: '1', name: 'Đồng nghiệp Nam (Tiền cơm trưa)', amount: 150000, type: 'lent', note: 'Chưa chuyển khoản', dueDate: '2026-09-10' },
  { id: '2', name: 'Bạn thân Huy (Mượn đổ xăng)', amount: 200000, type: 'borrowed', note: 'Hẹn trả lương', dueDate: '2026-09-15' },
];

export const ExpenseTracker: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [goals, setGoals] = useState<SavingGoal[]>(initialGoals);
  const [debts, setDebts] = useState<Debt[]>(initialDebts);

  const [activeTab, setActiveTab] = useState<'transactions' | 'budgets' | 'goals' | 'debts'>('transactions');

  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'quarter' | 'year'>('month');
  
  const [isComparisonOpen, setIsComparisonOpen] = useState(true);
  const [isChartOpen, setIsChartOpen] = useState(true);

  // Bộ lọc cột
  const [columnFilters, setColumnFilters] = useState({
    title: '',
    category: 'all',
    type: 'all',
    method: 'all',
    date: ''
  });

  const [chartDateRange, setChartDateRange] = useState({
    startDate: '2026-09-01',
    endDate: '2026-09-30'
  });

  const [selectedComparisonMonth, setSelectedComparisonMonth] = useState('2026-09');
  const [activeTooltip, setActiveTooltip] = useState<{ x: number; y: number; label: string; amount: number; type: string } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal Giao dịch
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: 'Ăn uống',
    method: 'bank' as 'cash' | 'bank',
    date: new Date().toISOString().split('T')[0]
  });

  // Modal Ngân sách
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [budgetForm, setBudgetForm] = useState({ category: 'Ăn uống', limit: '' });

  // Modal Mục tiêu tiết kiệm
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalForm, setGoalForm] = useState({ title: '', target: '', current: '', deadline: '' });

  // Modal Ghi nợ
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
  const [debtForm, setDebtForm] = useState({ name: '', amount: '', type: 'lent' as 'lent' | 'borrowed', note: '', dueDate: '' });

  // Tổng quan tài chính
  const filteredByTimeTransactions = transactions.filter(t => {
    if (timeFilter === 'all') return true;
    const txMonth = t.date.substring(0, 7);
    const currentMonth = '2026-09';
    if (timeFilter === 'month') return txMonth === currentMonth;
    if (timeFilter === 'quarter') return txMonth.startsWith('2026-07') || txMonth.startsWith('2026-08') || txMonth.startsWith('2026-09');
    if (timeFilter === 'year') return t.date.startsWith('2026');
    return true;
  });

  const totalIncome = filteredByTimeTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredByTimeTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // So sánh tháng n và n-1
  const getPreviousMonthString = (yearMonthStr: string) => {
    const [year, month] = yearMonthStr.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const prevMonthStr = getPreviousMonthString(selectedComparisonMonth);
  const expenseSelectedMonth = transactions.filter(t => t.type === 'expense' && t.date.startsWith(selectedComparisonMonth)).reduce((sum, t) => sum + t.amount, 0);
  const expensePreviousMonth = transactions.filter(t => t.type === 'expense' && t.date.startsWith(prevMonthStr)).reduce((sum, t) => sum + t.amount, 0);
  const comparisonDiffPercent = expensePreviousMonth === 0 ? 0 : Math.round(((expenseSelectedMonth - expensePreviousMonth) / expensePreviousMonth) * 100);

  const selectedMonthIncome = transactions.filter(t => t.type === 'income' && t.date.startsWith(selectedComparisonMonth)).reduce((sum, t) => sum + t.amount, 0);
  const selectedMonthExpense = expenseSelectedMonth;

  const categoryStatsForComparison = transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(selectedComparisonMonth))
    .reduce((acc: { [key: string]: number }, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  // Biểu đồ theo thời gian
  const chartFilteredTransactions = transactions.filter(t => {
    if (!chartDateRange.startDate || !chartDateRange.endDate) return true;
    return t.date >= chartDateRange.startDate && t.date <= chartDateRange.endDate;
  });

  const dailyStats = chartFilteredTransactions.reduce((acc: { [date: string]: { income: number; expense: number } }, t) => {
    if (!acc[t.date]) acc[t.date] = { income: 0, expense: 0 };
    if (t.type === 'income') acc[t.date].income += t.amount;
    else acc[t.date].expense += t.amount;
    return acc;
  }, {});

  const sortedDays = Object.keys(dailyStats).sort();

  // Lọc cột bảng giao dịch
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTitleCol = t.title.toLowerCase().includes(columnFilters.title.toLowerCase());
      const matchCategoryCol = columnFilters.category === 'all' || t.category === columnFilters.category;
      const matchTypeCol = columnFilters.type === 'all' || t.type === columnFilters.type;
      const matchMethodCol = columnFilters.method === 'all' || t.method === columnFilters.method;
      const matchDateCol = !columnFilters.date || t.date.includes(columnFilters.date);
      return matchSearch && matchTitleCol && matchCategoryCol && matchTypeCol && matchMethodCol && matchDateCol;
    });
  }, [transactions, searchTerm, columnFilters]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Xuất file CSV / Excel cá nhân
  const handleExportCSV = () => {
    const headers = ['ID,Khoản mục,Loại,So tien,Danh mục,Phuong thuc,Ngay\n'];
    const rows = filteredTransactions.map(t => `${t.id},"${t.title}",${t.type},${t.amount},${t.category},${t.method},${t.date}\n`);
    const blob = new Blob([...headers, ...rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bao_cao_tai_chinh_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- HANDLERS GIAO DỊCH ---
  const handleOpenModal = (transaction?: Transaction) => {
    if (transaction) {
      setEditingId(transaction.id);
      setForm({
        title: transaction.title,
        type: transaction.type,
        amount: transaction.amount.toString(),
        category: transaction.category,
        method: transaction.method || 'bank',
        date: transaction.date
      });
    } else {
      setEditingId(null);
      setForm({
        title: '',
        type: 'expense',
        amount: '',
        category: 'Ăn uống',
        method: 'bank',
        date: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.amount) return;

    if (editingId) {
      setTransactions(prev => prev.map(t => t.id === editingId ? {
        ...t,
        title: form.title,
        type: form.type,
        amount: Number(form.amount),
        category: form.category,
        method: form.method,
        date: form.date
      } : t));
    } else {
      const newTx: Transaction = {
        id: Date.now().toString(),
        title: form.title,
        type: form.type,
        amount: Number(form.amount),
        category: form.category,
        method: form.method,
        date: form.date
      };
      setTransactions(prev => [newTx, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa giao dịch này?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  // --- HANDLERS HẠN MỨC NGÂN SÁCH ---
  const handleOpenBudgetModal = (budget?: Budget) => {
    if (budget) {
      setEditingBudgetId(budget.id);
      setBudgetForm({ category: budget.category, limit: budget.limit.toString() });
    } else {
      setEditingBudgetId(null);
      setBudgetForm({ category: 'Ăn uống', limit: '' });
    }
    setIsBudgetModalOpen(true);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetForm.limit) return;
    if (editingBudgetId) {
      setBudgets(prev => prev.map(b => b.id === editingBudgetId ? { ...b, category: budgetForm.category, limit: Number(budgetForm.limit) } : b));
    } else {
      const newB: Budget = { id: Date.now().toString(), category: budgetForm.category, limit: Number(budgetForm.limit) };
      setBudgets(prev => [...prev, newB]);
    }
    setIsBudgetModalOpen(false);
  };

  const handleDeleteBudget = (id: string) => {
    if (window.confirm('Xóa hạn mức này?')) setBudgets(prev => prev.filter(b => b.id !== id));
  };

  // --- HANDLERS MỤC TIÊU TIẾT KIỆM ---
  const handleOpenGoalModal = (goal?: SavingGoal) => {
    if (goal) {
      setEditingGoalId(goal.id);
      setGoalForm({ title: goal.title, target: goal.target.toString(), current: goal.current.toString(), deadline: goal.deadline });
    } else {
      setEditingGoalId(null);
      setGoalForm({ title: '', target: '', current: '', deadline: new Date().toISOString().split('T')[0] });
    }
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalForm.title || !goalForm.target) return;
    if (editingGoalId) {
      setGoals(prev => prev.map(g => g.id === editingGoalId ? { ...g, title: goalForm.title, target: Number(goalForm.target), current: Number(goalForm.current || 0), deadline: goalForm.deadline } : g));
    } else {
      const newG: SavingGoal = { id: Date.now().toString(), title: goalForm.title, target: Number(goalForm.target), current: Number(goalForm.current || 0), deadline: goalForm.deadline };
      setGoals(prev => [...prev, newG]);
    }
    setIsGoalModalOpen(false);
  };

  const handleDeleteGoal = (id: string) => {
    if (window.confirm('Xóa mục tiêu này?')) setGoals(prev => prev.filter(g => g.id !== id));
  };

  // --- HANDLERS GHI NỢ ---
  const handleOpenDebtModal = (debt?: Debt) => {
    if (debt) {
      setEditingDebtId(debt.id);
      setDebtForm({ name: debt.name, amount: debt.amount.toString(), type: debt.type, note: debt.note, dueDate: debt.dueDate });
    } else {
      setEditingDebtId(null);
      setDebtForm({ name: '', amount: '', type: 'lent', note: '', dueDate: new Date().toISOString().split('T')[0] });
    }
    setIsDebtModalOpen(true);
  };

  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtForm.name || !debtForm.amount) return;
    if (editingDebtId) {
      setDebts(prev => prev.map(d => d.id === editingDebtId ? { ...d, name: debtForm.name, amount: Number(debtForm.amount), type: debtForm.type, note: debtForm.note, dueDate: debtForm.dueDate } : d));
    } else {
      const newD: Debt = { id: Date.now().toString(), name: debtForm.name, amount: Number(debtForm.amount), type: debtForm.type, note: debtForm.note, dueDate: debtForm.dueDate };
      setDebts(prev => [...prev, newD]);
    }
    setIsDebtModalOpen(false);
  };

  const handleDeleteDebt = (id: string) => {
    if (window.confirm('Xóa khoản ghi nợ này?')) setDebts(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="min-h-screen bg-primary-bg text-primary-text pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & Tổng quan */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-accent mb-2">
              <Wallet className="w-6 h-6" />
              <span className="font-semibold uppercase tracking-wider text-sm">Quản Lý Tài Chính Thông Minh</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Báo Cáo Thu Chi & Tiện Ích Cá Nhân</h1>
            <p className="text-gray-400 mt-1">Kiểm soát ngân sách, quản lý hạn mức, quỹ tiết kiệm và sổ ghi nợ nhanh chóng.</p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-4 py-2.5 rounded-xl font-medium transition cursor-pointer text-sm border border-white/10"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Xuất Excel / CSV</span>
            </button>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white px-5 py-2.5 rounded-xl font-medium transition shadow-lg shadow-accent/20 cursor-pointer text-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Thêm Giao Dịch</span>
            </button>
          </div>
        </div>

        {/* Thẻ thống kê tổng quan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-secondary-bg border border-white/10 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tổng Thu Vào</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{totalIncome.toLocaleString()} đ</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-secondary-bg border border-white/10 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tổng Chi Ra</p>
              <h3 className="text-2xl font-bold text-rose-400 mt-1">{totalExpense.toLocaleString()} đ</h3>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-secondary-bg border border-white/10 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Số Dư Hiện Tại</p>
              <h3 className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-accent' : 'text-rose-400'}`}>
                {balance.toLocaleString()} đ
              </h3>
            </div>
            <div className="p-3 bg-accent/10 text-accent rounded-2xl">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* --- THANH TAB CHUYỂN ĐỔI MODULE TIỆN ÍCH --- */}
        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'transactions' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-secondary-bg hover:bg-white/5 text-gray-400'
            }`}
          >
            <Wallet className="w-4 h-4" /> Lịch sử giao dịch
          </button>
          <button
            onClick={() => setActiveTab('budgets')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'budgets' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-secondary-bg hover:bg-white/5 text-gray-400'
            }`}
          >
            <Target className="w-4 h-4" /> Hạn mức ngân sách
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'goals' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-secondary-bg hover:bg-white/5 text-gray-400'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Quỹ tiết kiệm mục tiêu
          </button>
          <button
            onClick={() => setActiveTab('debts')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'debts' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-secondary-bg hover:bg-white/5 text-gray-400'
            }`}
          >
            <Users className="w-4 h-4" /> Sổ ghi nợ / Vay mượn
          </button>
        </div>

        {/* --- TAB 1: LỊCH SỬ GIAO DỊCH & BIỂU ĐỒ --- */}
        {activeTab === 'transactions' && (
          <div className="space-y-8">
            <div className="bg-secondary-bg border border-white/10 rounded-2xl p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Tìm kiếm chung toàn hệ thống..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-primary-bg border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent transition"
                />
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                <div className="flex items-center gap-2 bg-primary-bg border border-white/10 rounded-xl px-3 py-1.5">
                  <Calendar className="w-4 h-4 text-accent shrink-0" />
                  <select
                    value={timeFilter}
                    onChange={(e) => { setTimeFilter(e.target.value as 'all' | 'month' | 'quarter' | 'year'); setCurrentPage(1); }}
                    className="bg-transparent text-sm text-primary-text focus:outline-none transition cursor-pointer"
                  >
                    <option value="all" className="bg-secondary-bg">Tất cả thời gian</option>
                    <option value="month" className="bg-secondary-bg">Tháng này (Tháng 9)</option>
                    <option value="quarter" className="bg-secondary-bg">Quý này</option>
                    <option value="year" className="bg-secondary-bg">Năm nay (2026)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-secondary-bg border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-accent" />
                  <h3 className="text-lg font-bold">Lịch Sử Giao Dịch (Lọc theo từng cột)</h3>
                </div>
                <span className="text-xs text-gray-400">Hiển thị {paginatedTransactions.length} / {filteredTransactions.length} giao dịch</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-primary-bg/60 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-6">Khoản mục</th>
                      <th className="py-3 px-6">Danh mục</th>
                      <th className="py-3 px-6">Loại</th>
                      <th className="py-3 px-6">Phương thức</th>
                      <th className="py-3 px-6">Ngày giao dịch</th>
                      <th className="py-3 px-6 text-right">Số tiền</th>
                      <th className="py-3 px-6 text-right">Thao tác</th>
                    </tr>
                    <tr className="border-b border-white/10 bg-primary-bg/30 text-xs">
                      <th className="py-2 px-6">
                        <input type="text" placeholder="Lọc tên..." value={columnFilters.title} onChange={(e) => { setColumnFilters({...columnFilters, title: e.target.value}); setCurrentPage(1); }} className="w-full bg-secondary-bg border border-white/10 rounded-lg px-2.5 py-1 text-xs text-primary-text focus:outline-none focus:border-accent" />
                      </th>
                      <th className="py-2 px-6">
                        <select value={columnFilters.category} onChange={(e) => { setColumnFilters({...columnFilters, category: e.target.value}); setCurrentPage(1); }} className="w-full bg-secondary-bg border border-white/10 rounded-lg px-2.5 py-1 text-xs text-primary-text focus:outline-none focus:border-accent cursor-pointer">
                          <option value="all">Tất cả danh mục</option>
                          <option value="Ăn uống">Ăn uống</option>
                          <option value="Nhà ở">Nhà ở</option>
                          <option value="Lương">Lương</option>
                          <option value="Thưởng">Thưởng</option>
                          <option value="Mua sắm">Mua sắm</option>
                          <option value="Giải trí">Giải trí</option>
                          <option value="Đi lại">Đi lại</option>
                        </select>
                      </th>
                      <th className="py-2 px-6">
                        <select value={columnFilters.type} onChange={(e) => { setColumnFilters({...columnFilters, type: e.target.value}); setCurrentPage(1); }} className="w-full bg-secondary-bg border border-white/10 rounded-lg px-2.5 py-1 text-xs text-primary-text focus:outline-none focus:border-accent cursor-pointer">
                          <option value="all">Tất cả loại</option>
                          <option value="income">Thu vào</option>
                          <option value="expense">Chi ra</option>
                        </select>
                      </th>
                      <th className="py-2 px-6">
                        <select value={columnFilters.method} onChange={(e) => { setColumnFilters({...columnFilters, method: e.target.value}); setCurrentPage(1); }} className="w-full bg-secondary-bg border border-white/10 rounded-lg px-2.5 py-1 text-xs text-primary-text focus:outline-none focus:border-accent cursor-pointer">
                          <option value="all">Tất cả phương thức</option>
                          <option value="bank">Ngân hàng</option>
                          <option value="cash">Tiền mặt</option>
                        </select>
                      </th>
                      <th className="py-2 px-6">
                        <input type="date" value={columnFilters.date} onChange={(e) => { setColumnFilters({...columnFilters, date: e.target.value}); setCurrentPage(1); }} className="w-full bg-secondary-bg border border-white/10 rounded-lg px-2.5 py-1 text-xs text-primary-text focus:outline-none focus:border-accent" />
                      </th>
                      <th className="py-2 px-6 text-right text-gray-400">---</th>
                      <th className="py-2 px-6 text-right text-gray-400">---</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {paginatedTransactions.length === 0 ? (
                      <tr><td colSpan={7} className="py-8 text-center text-gray-400 text-xs">Không tìm thấy giao dịch nào phù hợp với bộ lọc cột.</td></tr>
                    ) : (
                      paginatedTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-white/[0.02] transition">
                          <td className="py-4 px-6 font-bold text-primary-text">{tx.title}</td>
                          <td className="py-4 px-6"><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-gray-300">{tx.category}</span></td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                              {tx.type === 'income' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                              {tx.type === 'income' ? 'Thu vào' : 'Chi ra'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${tx.method === 'bank' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>
                              {tx.method === 'bank' ? <CreditCard className="w-3.5 h-3.5" /> : <Banknote className="w-3.5 h-3.5" />}
                              {tx.method === 'bank' ? 'Ngân hàng' : 'Tiền mặt'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-gray-400">{tx.date}</td>
                          <td className={`py-4 px-6 text-right font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()} đ
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleOpenModal(tx)} className="p-1.5 text-gray-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition cursor-pointer" title="Chỉnh sửa"><Edit3 className="w-4 h-4 text-blue-400" /></button>
                              <button onClick={() => handleDelete(tx.id)} className="p-1.5 text-gray-400 hover:text-white rounded-lg bg-white/5 hover:bg-red-500/10 transition cursor-pointer" title="Xóa"><Trash2 className="w-4 h-4 text-red-400" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400 bg-primary-bg/30">
                  <span>Trang {currentPage} / {totalPages}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-35 cursor-pointer text-primary-text"><ChevronLeft className="w-4 h-4" /></button>
                    {Array.from({ length: totalPages }).map((_, idx) => (
                      <button key={idx} onClick={() => setCurrentPage(idx + 1)} className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${currentPage === idx + 1 ? 'bg-accent text-white' : 'bg-white/5 hover:bg-white/10 text-primary-text'}`}>{idx + 1}</button>
                    ))}
                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-35 cursor-pointer text-primary-text"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </div>

            {/* Biểu đồ biến động dòng tiền theo thời gian có trục X/Y rõ ràng */}
            <div className="bg-secondary-bg border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-center justify-between cursor-pointer select-none" onClick={() => setIsChartOpen(!isChartOpen)}>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent" />
                  <h3 className="font-bold text-base">Biểu Đồ Biến Động Dòng Tiền Theo Thời Gian</h3>
                </div>
                <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition cursor-pointer">
                  {isChartOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              <AnimatePresence>
                {isChartOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-primary-bg/50 p-4 rounded-xl border border-white/5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                        <Calendar className="w-4 h-4 text-accent" />
                        <span>Bộ lọc khoảng thời gian biểu đồ:</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">Từ:</span>
                        <input type="date" value={chartDateRange.startDate} onChange={(e) => setChartDateRange(prev => ({ ...prev, startDate: e.target.value }))} onClick={(e) => e.stopPropagation()} className="bg-secondary-bg border border-white/10 rounded-lg px-3 py-1.5 text-primary-text focus:outline-none focus:border-accent cursor-pointer" />
                        <span className="text-gray-400 ml-2">Đến:</span>
                        <input type="date" value={chartDateRange.endDate} onChange={(e) => setChartDateRange(prev => ({ ...prev, endDate: e.target.value }))} onClick={(e) => e.stopPropagation()} className="bg-secondary-bg border border-white/10 rounded-lg px-3 py-1.5 text-primary-text focus:outline-none focus:border-accent cursor-pointer" />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <span className="text-xs text-gray-400">Rê chuột vào các điểm tròn trên đường biểu đồ để xem chi tiết số tiền</span>
                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-3 h-1 bg-emerald-400 rounded-full inline-block"></span> Thu vào</span>
                        <span className="flex items-center gap-1.5 text-rose-400"><span className="w-3 h-1 bg-rose-400 rounded-full inline-block"></span> Chi ra</span>
                      </div>
                    </div>

                    {sortedDays.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-8">Không có dữ liệu giao dịch trong khoảng thời gian này.</p>
                    ) : (
                      <div className="pt-2 relative">
                        {activeTooltip && (
                          <div className="absolute z-20 px-3 py-2 bg-primary-bg/95 border border-white/20 rounded-xl shadow-2xl text-xs pointer-events-none backdrop-blur-md transform -translate-x-1/2 -translate-y-full mb-2" style={{ left: `${activeTooltip.x}px`, top: `${activeTooltip.y - 10}px` }}>
                            <p className="font-bold text-gray-300 mb-0.5">Ngày {activeTooltip.label}</p>
                            <p className={`font-extrabold ${activeTooltip.type === 'Thu vào' ? 'text-emerald-400' : 'text-rose-400'}`}>{activeTooltip.type}: {activeTooltip.amount.toLocaleString()} đ</p>
                          </div>
                        )}
                        <div className="relative h-72 w-full pt-2">
                          {(() => {
                            const maxVal = Math.max(...Object.values(dailyStats).map(d => Math.max(d.income, d.expense))) || 1000000;
                            const width = 800; const height = 240; 
                            const paddingLeft = 60; const paddingRight = 30; const paddingTop = 20; const paddingBottom = 40;
                            const usableWidth = width - paddingLeft - paddingRight; 
                            const usableHeight = height - paddingTop - paddingBottom;

                            const pointsIncome = sortedDays.map((date, idx) => ({
                              x: sortedDays.length === 1 ? paddingLeft + usableWidth / 2 : paddingLeft + (idx / (sortedDays.length - 1)) * usableWidth,
                              y: paddingTop + usableHeight - (dailyStats[date].income / maxVal) * usableHeight,
                              val: dailyStats[date].income, date
                            }));

                            const pointsExpense = sortedDays.map((date, idx) => ({
                              x: sortedDays.length === 1 ? paddingLeft + usableWidth / 2 : paddingLeft + (idx / (sortedDays.length - 1)) * usableWidth,
                              y: paddingTop + usableHeight - (dailyStats[date].expense / maxVal) * usableHeight,
                              val: dailyStats[date].expense, date
                            }));

                            const pathIncome = pointsIncome.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
                            const pathExpense = pointsExpense.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');

                            return (
                              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                                  const y = paddingTop + usableHeight * ratio;
                                  const labelVal = Math.round(maxVal * (1 - ratio));
                                  return (
                                    <g key={i}>
                                      <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                                      <text x={paddingLeft - 10} y={y + 4} fill="rgba(255,255,255,0.5)" fontSize="10" textAnchor="end">
                                        {labelVal > 1000000 ? `${(labelVal / 1000000).toFixed(1)}Tr` : `${Math.round(labelVal / 1000)}k`}
                                      </text>
                                    </g>
                                  );
                                })}

                                <line x1={paddingLeft} y1={paddingTop + usableHeight} x2={width - paddingRight} y2={paddingTop + usableHeight} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />

                                {sortedDays.length > 1 && <path d={pathIncome} fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                                {sortedDays.length > 1 && <path d={pathExpense} fill="none" stroke="#fb7185" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                                
                                {pointsIncome.map((p, i) => (
                                  <g key={`inc-${i}`} className="cursor-pointer">
                                    <circle cx={p.x} cy={p.y} r="6" className="fill-emerald-400 stroke-primary-bg stroke-2 hover:scale-150 transition-all" onMouseEnter={() => setActiveTooltip({ x: (p.x / width) * 800, y: (p.y / height) * 250, label: p.date, amount: p.val, type: 'Thu vào' })} onMouseLeave={() => setActiveTooltip(null)} />
                                    <text x={p.x} y={paddingTop + usableHeight + 20} fill="rgba(255,255,255,0.6)" fontSize="11" textAnchor="middle">{p.date.substring(5)}</text>
                                  </g>
                                ))}
                                {pointsExpense.map((p, i) => (
                                  <circle key={`exp-${i}`} cx={p.x} cy={p.y} r="6" className="fill-rose-400 stroke-primary-bg stroke-2 cursor-pointer hover:scale-150 transition-all" onMouseEnter={() => setActiveTooltip({ x: (p.x / width) * 800, y: (p.y / height) * 250, label: p.date, amount: p.val, type: 'Chi ra' })} onMouseLeave={() => setActiveTooltip(null)} />
                                ))}
                              </svg>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bảng so sánh dòng tiền cuối cùng */}
            <div className="bg-secondary-bg border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-center justify-between cursor-pointer select-none" onClick={() => setIsComparisonOpen(!isComparisonOpen)}>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-accent" />
                  <h3 className="font-bold text-base">Bảng So Sánh Dòng Tiền Theo Tháng (Tháng chọn và tháng trước)</h3>
                </div>
                <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition cursor-pointer">
                  {isComparisonOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              <AnimatePresence>
                {isComparisonOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-primary-bg/50 p-4 rounded-xl border border-white/5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                        <Calendar className="w-4 h-4 text-accent" />
                        <span>Chọn tháng cần phân tích (Tháng n):</span>
                      </div>
                      <input type="month" value={selectedComparisonMonth} onChange={(e) => setSelectedComparisonMonth(e.target.value)} onClick={(e) => e.stopPropagation()} className="bg-secondary-bg border border-white/10 rounded-lg px-3 py-1.5 text-xs text-primary-text focus:outline-none focus:border-accent cursor-pointer" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="bg-primary-bg/50 border border-white/5 rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between space-y-6">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-300">Tổng quan Thu & Chi (Tháng {selectedComparisonMonth})</span>
                          <span className="text-xs text-gray-400">Đơn vị: VNĐ</span>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-xs mb-1.5"><span className="text-emerald-400 font-semibold">Thu vào</span><span className="font-bold">{selectedMonthIncome.toLocaleString()} đ</span></div>
                            <div className="w-full bg-secondary-bg h-3 rounded-full overflow-hidden border border-white/5">
                              <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${selectedMonthIncome + selectedMonthExpense === 0 ? 0 : (selectedMonthIncome / (selectedMonthIncome + selectedMonthExpense || 1)) * 100}%` }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1.5"><span className="text-rose-400 font-semibold">Chi ra</span><span className="font-bold">{selectedMonthExpense.toLocaleString()} đ</span></div>
                            <div className="w-full bg-secondary-bg h-3 rounded-full overflow-hidden border border-white/5">
                              <div className="bg-rose-400 h-full rounded-full transition-all duration-500" style={{ width: `${selectedMonthIncome + selectedMonthExpense === 0 ? 0 : (selectedMonthExpense / (selectedMonthIncome + selectedMonthExpense || 1)) * 100}%` }}></div>
                            </div>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-400">So với tháng trước ({prevMonthStr})</p>
                            <p className="text-sm font-semibold mt-0.5">Tháng này: <span className="text-primary-text font-bold">{expenseSelectedMonth.toLocaleString()} đ</span> | Tháng trước: <span className="text-gray-400">{expensePreviousMonth.toLocaleString()} đ</span></p>
                          </div>
                          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold ${comparisonDiffPercent <= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {comparisonDiffPercent <= 0 ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                            <span>{Math.abs(comparisonDiffPercent)}% so với tháng trước</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-primary-bg/50 border border-white/5 rounded-2xl p-6 flex flex-col justify-between space-y-4">
                        <div className="flex items-center gap-2"><PieIcon className="w-4 h-4 text-accent" /><h4 className="font-bold text-sm">Tỷ Trọng Chi Tiêu (Tháng {selectedComparisonMonth})</h4></div>
                        <div className="space-y-3 flex-grow overflow-y-auto max-h-[180px]">
                          {Object.keys(categoryStatsForComparison).length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-6">Không có khoản chi nào trong tháng này.</p>
                          ) : (
                            Object.entries(categoryStatsForComparison).map(([cat, amount]) => {
                              const percent = selectedMonthExpense === 0 ? 0 : Math.round((amount / selectedMonthExpense) * 100);
                              return (
                                <div key={cat} className="space-y-1">
                                  <div className="flex justify-between text-xs"><span className="text-gray-300 font-medium">{cat}</span><span className="font-bold text-accent">{amount.toLocaleString()} đ ({percent}%)</span></div>
                                  <div className="w-full bg-secondary-bg h-1.5 rounded-full overflow-hidden"><div className="bg-accent h-full rounded-full" style={{ width: `${percent}%` }}></div></div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* --- TAB 2: QUẢN LÝ HẠN MỨC NGÂN SÁCH (THÊM/SỬA/XÓA) --- */}
        {activeTab === 'budgets' && (
          <div className="bg-secondary-bg border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Hạn Mức Ngân Sách Theo Danh Mục (Tháng này)</h3>
                <p className="text-xs text-gray-400 mt-0.5">Hệ thống sẽ cảnh báo đỏ khi chi tiêu đạt trên 80% hạn mức giới hạn.</p>
              </div>
              <button 
                onClick={() => handleOpenBudgetModal()}
                className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer shadow-lg shadow-accent/20"
              >
                <Plus className="w-4 h-4" /> Thêm hạn mức
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {budgets.map(b => {
                const spent = transactions
                  .filter(t => t.type === 'expense' && t.category === b.category && t.date.startsWith('2026-09'))
                  .reduce((sum, t) => sum + t.amount, 0);
                const percent = Math.round((spent / b.limit) * 100);
                const isWarning = percent >= 80;

                return (
                  <div key={b.id} className="bg-primary-bg/50 border border-white/5 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base text-primary-text">{b.category}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                          isWarning ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {isWarning ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          {isWarning ? 'Sắp chạm hạn mức!' : 'An toàn'}
                        </span>
                        <button onClick={() => handleOpenBudgetModal(b)} className="p-1 text-gray-400 hover:text-blue-400 bg-white/5 rounded-lg transition cursor-pointer"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteBudget(b.id)} className="p-1 text-gray-400 hover:text-red-400 bg-white/5 rounded-lg transition cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Đã chi: <strong className="text-primary-text">{spent.toLocaleString()} đ</strong></span>
                        <span className="text-gray-400">Hạn mức: <strong className="text-accent">{b.limit.toLocaleString()} đ</strong></span>
                      </div>
                      <div className="w-full bg-secondary-bg h-3 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${isWarning ? 'bg-rose-500' : 'bg-accent'}`} style={{ width: `${Math.min(percent, 100)}%` }}></div>
                      </div>
                    </div>
                    <p className="text-xs text-right text-gray-400">Đã sử dụng <strong>{percent}%</strong> hạn mức</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- TAB 3: QUỸ TIẾT KIỆM MỤC TIÊU (THÊM/SỬA/XÓA) --- */}
        {activeTab === 'goals' && (
          <div className="bg-secondary-bg border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Hũ Tiết Kiệm & Mục Tiêu Cá Nhân</h3>
                <p className="text-xs text-gray-400 mt-0.5">Tích góp cho các dự định lớn như mua xe, laptop, về quê ăn Tết...</p>
              </div>
              <button 
                onClick={() => handleOpenGoalModal()}
                className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer shadow-lg shadow-accent/20"
              >
                <Plus className="w-4 h-4" /> Thêm mục tiêu
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goals.map(g => {
                const percent = Math.round((g.current / g.target) * 100);
                return (
                  <div key={g.id} className="bg-primary-bg/50 border border-white/5 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base text-primary-text">{g.title}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleOpenGoalModal(g)} className="p-1 text-gray-400 hover:text-blue-400 bg-white/5 rounded-lg transition cursor-pointer"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteGoal(g.id)} className="p-1 text-gray-400 hover:text-red-400 bg-white/5 rounded-lg transition cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Đã tích lũy: <strong className="text-emerald-400">{g.current.toLocaleString()} đ</strong></span>
                        <span className="text-gray-400">Mục tiêu: <strong className="text-accent">{g.target.toLocaleString()} đ</strong></span>
                      </div>
                      <div className="w-full bg-secondary-bg h-3 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(percent, 100)}%` }}></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-gray-400">Hạn chót: {g.deadline}</span>
                      <span className="text-xs font-bold text-emerald-400">{percent}% hoàn thành</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- TAB 4: SỔ GHI NỢ / VAY MƯỢN (THÊM/SỬA/XÓA) --- */}
        {activeTab === 'debts' && (
          <div className="bg-secondary-bg border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Sổ Ghi Nợ / Khoản Cho Vay & Đi Mượn</h3>
                <p className="text-xs text-gray-400 mt-0.5">Theo dõi chặt chẽ các khoản tiền lẻ cho bạn bè, đồng nghiệp mượn.</p>
              </div>
              <button 
                onClick={() => handleOpenDebtModal()}
                className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer shadow-lg shadow-accent/20"
              >
                <Plus className="w-4 h-4" /> Thêm khoản nợ
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-primary-bg/60 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-6">Người giao dịch</th>
                    <th className="py-3 px-6">Phân loại</th>
                    <th className="py-3 px-6">Ghi chú</th>
                    <th className="py-3 px-6">Hạn trả</th>
                    <th className="py-3 px-6 text-right">Số tiền</th>
                    <th className="py-3 px-6 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {debts.map(d => (
                    <tr key={d.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-4 px-6 font-bold text-primary-text">{d.name}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          d.type === 'lent' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {d.type === 'lent' ? 'Cho mượn (Thu về)' : 'Đi mượn (Phải trả)'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-300">{d.note}</td>
                      <td className="py-4 px-6 text-gray-400">{d.dueDate}</td>
                      <td className={`py-4 px-6 text-right font-bold ${d.type === 'lent' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {d.type === 'lent' ? '+' : '-'}{d.amount.toLocaleString()} đ
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleOpenDebtModal(d)} className="p-1.5 text-gray-400 hover:text-blue-400 bg-white/5 rounded-lg transition cursor-pointer" title="Chỉnh sửa"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteDebt(d.id)} className="p-1.5 text-gray-400 hover:text-red-400 bg-white/5 rounded-lg transition cursor-pointer" title="Xóa"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* --- MODAL THÊM / SỬA GIAO DỊCH --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-secondary-bg border border-white/10 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold">{editingId ? 'Chỉnh Sửa Giao Dịch' : 'Thêm Khoản Thu/Chi Mới'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-full bg-white/5 transition cursor-pointer"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Tên khoản mục</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Ví dụ: Tiền điện, Lương tháng..." className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Loại giao dịch</label>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'income' | 'expense' })} className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent">
                      <option value="expense">Chi ra</option>
                      <option value="income">Thu vào</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Số tiền (đ)</label>
                    <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required placeholder="Ví dụ: 500000" className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Danh mục</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent">
                      <option value="Ăn uống">Ăn uống</option>
                      <option value="Nhà ở">Nhà ở</option>
                      <option value="Lương">Lương</option>
                      <option value="Thưởng">Thưởng</option>
                      <option value="Mua sắm">Mua sắm</option>
                      <option value="Giải trí">Giải trí</option>
                      <option value="Đi lại">Đi lại</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Phương thức</label>
                    <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as 'cash' | 'bank' })} className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent">
                      <option value="bank">Ngân hàng</option>
                      <option value="cash">Tiền mặt</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Ngày giao dịch</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" />
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-sm font-medium rounded-xl transition cursor-pointer">Hủy</button>
                  <button type="submit" className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-accent/20"><Save className="w-4 h-4" /><span>Lưu Giao Dịch</span></button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL THÊM / SỬA HẠN MỨC NGÂN SÁCH --- */}
      <AnimatePresence>
        {isBudgetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-secondary-bg border border-white/10 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold">{editingBudgetId ? 'Chỉnh Sửa Hạn Mức' : 'Thêm Hạn Mức Ngân Sách'}</h2>
                <button onClick={() => setIsBudgetModalOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-full bg-white/5 transition cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSaveBudget} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Danh mục</label>
                  <select value={budgetForm.category} onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })} className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent">
                    <option value="Ăn uống">Ăn uống</option>
                    <option value="Nhà ở">Nhà ở</option>
                    <option value="Mua sắm">Mua sắm</option>
                    <option value="Đi lại">Đi lại</option>
                    <option value="Giải trí">Giải trí</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Hạn mức tối đa (đ)</label>
                  <input type="number" value={budgetForm.limit} onChange={(e) => setBudgetForm({ ...budgetForm, limit: e.target.value })} required placeholder="Ví dụ: 4000000" className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" />
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsBudgetModalOpen(false)} className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-sm font-medium rounded-xl transition cursor-pointer">Hủy</button>
                  <button type="submit" className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-xl transition cursor-pointer shadow-lg shadow-accent/20">Lưu Hạn Mức</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL THÊM / SỬA MỤC TIÊU TIẾT KIỆM --- */}
      <AnimatePresence>
        {isGoalModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-secondary-bg border border-white/10 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold">{editingGoalId ? 'Chỉnh Sửa Mục Tiêu' : 'Thêm Mục Tiêu Tiết Kiệm'}</h2>
                <button onClick={() => setIsGoalModalOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-full bg-white/5 transition cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSaveGoal} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Tên mục tiêu</label>
                  <input type="text" value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} required placeholder="Ví dụ: Mua Laptop mới" className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Mục tiêu (đ)</label>
                    <input type="number" value={goalForm.target} onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })} required placeholder="25000000" className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Đã tích lũy (đ)</label>
                    <input type="number" value={goalForm.current} onChange={(e) => setGoalForm({ ...goalForm, current: e.target.value })} placeholder="1000000" className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Hạn chót</label>
                  <input type="date" value={goalForm.deadline} onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })} required className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" />
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsGoalModalOpen(false)} className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-sm font-medium rounded-xl transition cursor-pointer">Hủy</button>
                  <button type="submit" className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-xl transition cursor-pointer shadow-lg shadow-accent/20">Lưu Mục Tiêu</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL THÊM / SỬA SỔ GHI NỢ --- */}
      <AnimatePresence>
        {isDebtModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-secondary-bg border border-white/10 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold">{editingDebtId ? 'Chỉnh Sửa Khoản Nợ' : 'Thêm Khoản Nợ / Vay Mượn'}</h2>
                <button onClick={() => setIsDebtModalOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-full bg-white/5 transition cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSaveDebt} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Tên người giao dịch</label>
                  <input type="text" value={debtForm.name} onChange={(e) => setDebtForm({ ...debtForm, name: e.target.value })} required placeholder="Ví dụ: Bạn Nam" className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Phân loại</label>
                    <select value={debtForm.type} onChange={(e) => setDebtForm({ ...debtForm, type: e.target.value as 'lent' | 'borrowed' })} className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent">
                      <option value="lent">Cho mượn</option>
                      <option value="borrowed">Đi mượn</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Số tiền (đ)</label>
                    <input type="number" value={debtForm.amount} onChange={(e) => setDebtForm({ ...debtForm, amount: e.target.value })} required placeholder="200000" className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Ghi chú</label>
                  <input type="text" value={debtForm.note} onChange={(e) => setDebtForm({ ...debtForm, note: e.target.value })} placeholder="Ví dụ: Tiền cơm trưa" className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Hạn trả</label>
                  <input type="date" value={debtForm.dueDate} onChange={(e) => setDebtForm({ ...debtForm, dueDate: e.target.value })} required className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" />
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsDebtModalOpen(false)} className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-sm font-medium rounded-xl transition cursor-pointer">Hủy</button>
                  <button type="submit" className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-xl transition cursor-pointer shadow-lg shadow-accent/20">Lưu Khoản Nợ</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};