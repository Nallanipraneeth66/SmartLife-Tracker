import React, { useEffect, useMemo, useState } from "react";
import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getExpensesMeta,
  updateExpensesMeta,
} from "../api/expensesApi";
import { getProfile, updateProfile } from "../api/profileApi";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { FiTrash2, FiEdit, FiDownload, FiFilter, FiChevronDown, FiChevronUp, FiAlertTriangle } from "react-icons/fi";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
);

const CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Others"];

export default function ExpensesPage() {
  const { user } = useAuth();
  
  // Don't render until user is loaded
  if (!user || !user.id) {
    return null;
  }
  
  const userId = user.id;
  const [expenses, setExpenses] = useState([]);
  const [meta, setMeta] = useState(null);
  const [userLimits, setUserLimits] = useState({ weeklyLimit: null, monthlyLimit: null });
  const [showLimitSection, setShowLimitSection] = useState(false);
  const [weeklyLimitInput, setWeeklyLimitInput] = useState("");
  const [monthlyLimitInput, setMonthlyLimitInput] = useState("");
  const [savingLimit, setSavingLimit] = useState(false);

  // form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => dayjs().format("YYYY-MM-DD"));
  const [time, setTime] = useState(() => dayjs().format("HH:mm"));
  const [editing, setEditing] = useState(null);

  // UI states
  const [tab, setTab] = useState("Today");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [minAmountFilter, setMinAmountFilter] = useState("");
  const [maxAmountFilter, setMaxAmountFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // load data
  const loadAll = async () => {
    try {
      const [res, metaRes, profileRes] = await Promise.all([
        getExpenses(userId), 
        getExpensesMeta(),
        getProfile(userId).catch(() => ({ data: [] }))
      ]);
      setExpenses(Array.isArray(res.data) ? res.data : []);
      setMeta(metaRes?.data ?? null);
      
      // Handle profile data - get limits from profile
      const profiles = Array.isArray(profileRes.data) ? profileRes.data : (profileRes.data ? [profileRes.data] : []);
      const userProfile = profiles.find(p => p.userId === userId) || {};
      setUserLimits({
        weeklyLimit: userProfile.weeklyLimit ?? null,
        monthlyLimit: userProfile.monthlyLimit ?? null
      });
      setWeeklyLimitInput(userProfile.weeklyLimit ?? "");
      setMonthlyLimitInput(userProfile.monthlyLimit ?? "");
    } catch (err) {
      console.error("Failed to load expenses data:", err);
      setExpenses([]);
      setMeta(null);
      setUserLimits({ weeklyLimit: null, monthlyLimit: null });
    }
  };

  useEffect(() => {
    if (userId) {
      loadAll();
    }
  }, [userId]);

  // helpers for date ranges
  const todayISO = dayjs().format("YYYY-MM-DD");
  const startOfWeekISO = () => dayjs().startOf("week").format("YYYY-MM-DD");
  const endOfWeekISO = () => dayjs().endOf("week").format("YYYY-MM-DD");
  const startOfMonthISO = () => dayjs().startOf("month").format("YYYY-MM-DD");
  const endOfMonthISO = () => dayjs().endOf("month").format("YYYY-MM-DD");

  // filtered list according to tab + filters
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return expenses.filter((e) => {
      // tab filter
      if (tab === "Today" && e.date !== todayISO) return false;
      if (tab === "Week" && (e.date < startOfWeekISO() || e.date > endOfWeekISO())) return false;
      if (tab === "Month" && (e.date < startOfMonthISO() || e.date > endOfMonthISO())) return false;
      // search
      if (s && !("" + e.title + " " + e.category).toLowerCase().includes(s)) return false;
      // category filter
      if (categoryFilter !== "All" && e.category !== categoryFilter) return false;
      // amount filters
      if (minAmountFilter !== "" && Number(e.amount) < Number(minAmountFilter)) return false;
      if (maxAmountFilter !== "" && Number(e.amount) > Number(maxAmountFilter)) return false;
      return true;
    }).sort((a, b) => (a.date < b.date ? 1 : -1) || (a.time < b.time ? 1 : -1));
  }, [expenses, tab, search, categoryFilter, minAmountFilter, maxAmountFilter, todayISO]);

  // totals for summary cards (Today / Week / Month / All)
  const totals = useMemo(() => {
    let today = 0,
      week = 0,
      month = 0,
      all = 0;
    const sWeek = startOfWeekISO();
    const eWeek = endOfWeekISO();
    const sMonth = startOfMonthISO();
    const eMonth = endOfMonthISO();
    expenses.forEach((e) => {
      all += e.amount;
      if (e.date === todayISO) today += e.amount;
      if (e.date >= sWeek && e.date <= eWeek) week += e.amount;
      if (e.date >= sMonth && e.date <= eMonth) month += e.amount;
    });
    return { today, week, month, all };
  }, [expenses, todayISO]);

  // category totals for filtered view & for month
  const categoryTotalsFiltered = useMemo(() => {
    const map = {};
    filtered.forEach((f) => (map[f.category] = (map[f.category] || 0) + f.amount));
    return map;
  }, [filtered]);

  const categoryTotalsMonth = useMemo(() => {
    const map = {};
    const sMonth = startOfMonthISO();
    const eMonth = endOfMonthISO();
    expenses
      .filter((e) => e.date >= sMonth && e.date <= eMonth)
      .forEach((f) => (map[f.category] = (map[f.category] || 0) + f.amount));
    return map;
  }, [expenses]);

  // daily trend for last 14 days (last 14 labels)
  const lastNDays = (n = 14) => Array.from({ length: n }).map((_, i) => dayjs().subtract(n - 1 - i, "day").format("YYYY-MM-DD"));
  const last14 = useMemo(() => lastNDays(14), []);
  const dailyTrend = useMemo(() => {
    const map = {};
    expenses.forEach((e) => (map[e.date] = (map[e.date] || 0) + e.amount));
    const labels = last14.map((d) => dayjs(d).format("DD MMM"));
    const data = last14.map((d) => map[d] || 0);
    return { labels, data };
  }, [expenses, last14]);

  // period breakdown (Morning/Afternoon/Evening/Night)
  const periodBreakdown = useMemo(() => {
    const items = tab === "Today" ? expenses.filter((e) => e.date === todayISO) : filtered;
    const bucketTotals = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    items.forEach((it) => {
      const hh = Number(it.time?.slice(0, 2) ?? "0");
      if (hh >= 5 && hh < 12) bucketTotals.morning += it.amount;
      else if (hh >= 12 && hh < 17) bucketTotals.afternoon += it.amount;
      else if (hh >= 17 && hh < 22) bucketTotals.evening += it.amount;
      else bucketTotals.night += it.amount;
    });
    return bucketTotals;
  }, [expenses, filtered, tab, todayISO]);

  // top categories (month)
  const topCategoriesMonth = useMemo(() => {
    const arr = Object.entries(categoryTotalsMonth).sort((a, b) => b[1] - a[1]);
    return arr.slice(0, 5);
  }, [categoryTotalsMonth]);

  // insights
  const insights = useMemo(() => {
    const thisWeek = totals.week;
    const prevWeekStart = dayjs().startOf("week").subtract(7, "day").format("YYYY-MM-DD");
    const prevWeekEnd = dayjs().endOf("week").subtract(7, "day").format("YYYY-MM-DD");
    const prevWeekTotal = expenses.filter((e) => e.date >= prevWeekStart && e.date <= prevWeekEnd).reduce((s, x) => s + x.amount, 0);
    const weekChange = prevWeekTotal === 0 ? (thisWeek === 0 ? 0 : 100) : Math.round(((thisWeek - prevWeekTotal) / prevWeekTotal) * 100);

    const monthTotal = totals.month;
    const topCat = topCategoriesMonth.length ? topCategoriesMonth[0] : null;
    const topCatShare = monthTotal > 0 && topCat ? Math.round((topCat[1] / monthTotal) * 100) : 0;

    const sMonth = dayjs().startOf("month").format("YYYY-MM-DD");
    const today = dayjs().format("YYYY-MM-DD");
    const daysSoFar = dayjs().date();
    const monthSoFarList = expenses.filter((e) => e.date >= sMonth && e.date <= today);
    const monthSoFarTotal = monthSoFarList.reduce((s, x) => s + x.amount, 0);
    const avgPerDay = daysSoFar > 0 ? monthSoFarTotal / daysSoFar : 0;
    const projectedMonth = Math.round(avgPerDay * dayjs().daysInMonth());

    const limit = meta?.monthlyLimit ?? null;
    const willExceedLimit = limit ? projectedMonth > limit : false;
    const exceedBy = limit && willExceedLimit ? projectedMonth - limit : 0;

    return { weekChange, topCat: topCat ? { name: topCat[0], amount: topCat[1] } : null, topCatShare, projectedMonth, willExceedLimit, exceedBy, monthSoFarTotal };
  }, [expenses, totals, topCategoriesMonth, meta]);

  // pie data for filtered view
  const pieData = useMemo(() => {
    const labels = Object.keys(categoryTotalsFiltered);
    const data = Object.values(categoryTotalsFiltered);
    return { labels, datasets: [{ data, backgroundColor: ["#60a5fa", "#4ade80", "#f472b6", "#facc15", "#fb923c", "#a78bfa"] }] };
  }, [categoryTotalsFiltered]);

  // line/bar data for trend
  const trendData = useMemo(() => {
    return {
      labels: dailyTrend.labels,
      datasets: [
        { label: "Daily Spend", data: dailyTrend.data, fill: true, borderColor: "#60a5fa", backgroundColor: "rgba(96,165,250,0.12)" },
      ],
    };
  }, [dailyTrend]);

  // period chart
  const periodData = useMemo(() => {
    return {
      labels: ["Morning", "Afternoon", "Evening", "Night"],
      datasets: [{ label: "Amount", data: [periodBreakdown.morning, periodBreakdown.afternoon, periodBreakdown.evening, periodBreakdown.night], backgroundColor: ["#7dd3fc", "#60a5fa", "#a78bfa", "#c4b5fd"] }],
    };
  }, [periodBreakdown]);

  // create/update expense
  const handleAddOrUpdate = async () => {
    if (!title.trim() || !amount || Number(amount) <= 0) {
      alert("Enter valid title and amount");
      return;
    }
    const payload = { title: title.trim(), category, amount: Number(amount), date, time };
    try {
      if (editing) {
        await updateExpense(editing.id, payload, userId);
        setEditing(null);
      } else {
        await addExpense(payload, userId);
      }
      setTitle("");
      setCategory(CATEGORIES[0]);
      setAmount("");
      setDate(dayjs().format("YYYY-MM-DD"));
      setTime(dayjs().format("HH:mm"));
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Save failed");
    }
  };

  const handleEdit = (e) => {
    setEditing(e);
    setTitle(e.title);
    setCategory(e.category);
    setAmount(e.amount);
    setDate(e.date);
    setTime(e.time);
    window.scrollTo({ top: 180, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!id) return;
    if (!confirm("Delete this expense?")) return;
    await deleteExpense(id, userId);
    await loadAll();
  };

  // CSV export for current filtered view
  const exportCSV = () => {
    const rows = filtered.map((r) => ({ date: r.date, time: r.time, title: r.title, category: r.category, amount: r.amount }));
    const header = ["date", "time", "title", "category", "amount"];
    const csv = [header.join(",")].concat(rows.map((r) => header.map((h) => `"${r[h]}"`).join(","))).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses_${tab}_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // update meta (e.g., monthly limit)
  const updateMeta = async (newMeta) => {
    setMeta(newMeta);
    await updateExpensesMeta(newMeta);
  };

  // Save spending limits
  const saveLimits = async () => {
    const weeklyLimit = weeklyLimitInput === "" ? null : Number(weeklyLimitInput);
    const monthlyLimit = monthlyLimitInput === "" ? null : Number(monthlyLimitInput);
    
    if (weeklyLimit !== null && (isNaN(weeklyLimit) || weeklyLimit <= 0)) {
      alert("Please enter a valid positive number for weekly limit");
      return;
    }
    if (monthlyLimit !== null && (isNaN(monthlyLimit) || monthlyLimit <= 0)) {
      alert("Please enter a valid positive number for monthly limit");
      return;
    }

    setSavingLimit(true);
    try {
      // Get current profile to preserve other fields
      const profileRes = await getProfile(userId);
      const profiles = Array.isArray(profileRes.data) ? profileRes.data : (profileRes.data ? [profileRes.data] : []);
      const currentProfile = profiles.find(p => p.userId === userId) || {};
      
      // Update profile with limits
      await updateProfile({
        name: currentProfile.name || user.name || "",
        age: currentProfile.age || user.age || 0,
        email: currentProfile.email || user.email || "",
        weeklyLimit: weeklyLimit,
        monthlyLimit: monthlyLimit
      }, userId);
      
      setUserLimits({
        weeklyLimit: weeklyLimit,
        monthlyLimit: monthlyLimit
      });
      setShowLimitSection(false);
      alert("Spending limits saved successfully!");
      await loadAll();
    } catch (err) {
      console.error("Failed to save limits:", err);
      alert(`Failed to save limits: ${err.response?.data?.message || err.message || "Unknown error"}`);
    } finally {
      setSavingLimit(false);
    }
  };

  // Calculate remaining budgets
  const weeklyRemaining = useMemo(() => {
    if (userLimits.weeklyLimit === null) return null;
    return userLimits.weeklyLimit - totals.week;
  }, [userLimits.weeklyLimit, totals.week]);

  const monthlyRemaining = useMemo(() => {
    if (userLimits.monthlyLimit === null) return null;
    return userLimits.monthlyLimit - totals.month;
  }, [userLimits.monthlyLimit, totals.month]);

  return (
    <div className="p-3 sm:p-4 md:p-6 text-white space-y-4 sm:space-y-6">
      {/* header + search + export */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Expenses</h1>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <input placeholder="Search title or category..." className="px-3 py-2 rounded-lg text-black w-full sm:w-64 text-sm sm:text-base" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button title="Filters" onClick={() => setShowFilters((s) => !s)} className="absolute right-1 top-1 p-2 rounded-md">
              <FiFilter />
            </button>
          </div>

          <button onClick={exportCSV} className="btn-shine bg-indigo-500 px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap">
            <FiDownload /> <span className="hidden sm:inline">Export CSV</span><span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      {/* Collapsible Set Spending Limit Section */}
      <div className="glass rounded-2xl overflow-hidden border border-white/10">
        <button
          onClick={() => setShowLimitSection(!showLimitSection)}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-white/5 transition"
        >
          <h2 className="text-lg sm:text-xl font-bold">Set Spending Limit</h2>
          {showLimitSection ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
        </button>
        
        {showLimitSection && (
          <div className="p-4 sm:p-5 pt-0 border-t border-white/10 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Weekly Limit */}
              <div>
                <label className="text-xs sm:text-sm opacity-70 block mb-2">Weekly Spending Limit (₹)</label>
                <input
                  type="number"
                  placeholder="Enter weekly limit"
                  className="p-2 sm:p-3 rounded-lg text-black w-full text-sm sm:text-base"
                  value={weeklyLimitInput}
                  onChange={(e) => setWeeklyLimitInput(e.target.value)}
                  min="0"
                />
              </div>

              {/* Monthly Limit */}
              <div>
                <label className="text-xs sm:text-sm opacity-70 block mb-2">Monthly Spending Limit (₹)</label>
                <input
                  type="number"
                  placeholder="Enter monthly limit"
                  className="p-2 sm:p-3 rounded-lg text-black w-full text-sm sm:text-base"
                  value={monthlyLimitInput}
                  onChange={(e) => setMonthlyLimitInput(e.target.value)}
                  min="0"
                />
              </div>
            </div>
            <button
              onClick={saveLimits}
              disabled={savingLimit}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 px-4 py-2 sm:py-3 rounded-lg text-white font-semibold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingLimit ? "Saving..." : "Save Limits"}
            </button>
          </div>
        )}
      </div>

      {/* Budget Overview Cards - Only show if limits are set */}
      {(userLimits.weeklyLimit !== null || userLimits.monthlyLimit !== null) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Weekly Budget Card */}
          {userLimits.weeklyLimit !== null && (
            <div className={`glass p-4 sm:p-5 rounded-2xl border-2 ${
              weeklyRemaining !== null && weeklyRemaining < 0 
                ? "border-red-500/50 bg-red-500/10" 
                : "border-blue-500/30"
            }`}>
              <div className="text-sm opacity-70 mb-2">Weekly Budget</div>
              <div className="text-2xl font-bold mb-1">₹{totals.week}</div>
              <div className="text-xs sm:text-sm opacity-70 mb-2">
                Limit: <span className="font-semibold">₹{userLimits.weeklyLimit}</span>
              </div>
              <div className={`text-sm sm:text-base font-semibold flex items-center gap-2 ${
                weeklyRemaining !== null && weeklyRemaining < 0 ? "text-red-400" : "text-green-400"
              }`}>
                {weeklyRemaining !== null && weeklyRemaining < 0 && <FiAlertTriangle />}
                Remaining: ₹{weeklyRemaining !== null ? Math.max(0, weeklyRemaining) : 0}
                {weeklyRemaining !== null && weeklyRemaining < 0 && (
                  <span className="text-red-400 ml-1">(Exceeded by ₹{Math.abs(weeklyRemaining)})</span>
                )}
              </div>
              {weeklyRemaining !== null && weeklyRemaining < 0 && (
                <div className="text-xs sm:text-sm text-red-400 font-bold mt-2 flex items-center gap-1">
                  <FiAlertTriangle /> You have exceeded your weekly spending limit
                </div>
              )}
            </div>
          )}

          {/* Monthly Budget Card */}
          {userLimits.monthlyLimit !== null && (
            <div className={`glass p-4 sm:p-5 rounded-2xl border-2 ${
              monthlyRemaining !== null && monthlyRemaining < 0 
                ? "border-red-500/50 bg-red-500/10" 
                : "border-purple-500/30"
            }`}>
              <div className="text-sm opacity-70 mb-2">Monthly Budget</div>
              <div className="text-2xl font-bold mb-1">₹{totals.month}</div>
              <div className="text-xs sm:text-sm opacity-70 mb-2">
                Limit: <span className="font-semibold">₹{userLimits.monthlyLimit}</span>
              </div>
              <div className={`text-sm sm:text-base font-semibold flex items-center gap-2 ${
                monthlyRemaining !== null && monthlyRemaining < 0 ? "text-red-400" : "text-green-400"
              }`}>
                {monthlyRemaining !== null && monthlyRemaining < 0 && <FiAlertTriangle />}
                Remaining: ₹{monthlyRemaining !== null ? Math.max(0, monthlyRemaining) : 0}
                {monthlyRemaining !== null && monthlyRemaining < 0 && (
                  <span className="text-red-400 ml-1">(Exceeded by ₹{Math.abs(monthlyRemaining)})</span>
                )}
              </div>
              {monthlyRemaining !== null && monthlyRemaining < 0 && (
                <div className="text-xs sm:text-sm text-red-400 font-bold mt-2 flex items-center gap-1">
                  <FiAlertTriangle /> You have exceeded your monthly spending limit
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* filters (toggle) */}
      {showFilters && (
        <div className="glass p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="p-2 rounded-md text-black text-sm sm:text-base flex-1 sm:flex-none min-w-[150px]">
            <option value="All">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <input type="number" placeholder="Min amount" className="p-2 rounded-md text-black w-full sm:w-28 text-sm sm:text-base" value={minAmountFilter === "" ? "" : minAmountFilter} onChange={(e) => setMinAmountFilter(e.target.value === "" ? "" : Number(e.target.value))} />
          <input type="number" placeholder="Max amount" className="p-2 rounded-md text-black w-full sm:w-28 text-sm sm:text-base" value={maxAmountFilter === "" ? "" : maxAmountFilter} onChange={(e) => setMaxAmountFilter(e.target.value === "" ? "" : Number(e.target.value))} />

          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto sm:ml-auto">
            <div className="text-xs sm:text-sm opacity-80 whitespace-nowrap">Monthly limit:</div>
            <input type="number" placeholder="₹" className="p-2 rounded-md text-black w-full sm:w-32 text-sm sm:text-base" value={meta?.monthlyLimit ?? ""} onChange={(e) => setMeta({ ...(meta ?? {}), monthlyLimit: e.target.value === "" ? undefined : Number(e.target.value) })} />
            <button onClick={() => meta && updateMeta(meta)} className="bg-green-500 px-3 py-2 rounded-md text-xs sm:text-sm whitespace-nowrap">Save</button>
          </div>
        </div>
      )}

      {/* Summary cards (Apple-style rounded boxes) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass p-5 rounded-2xl">
          <div className="text-sm opacity-70">Today</div>
          <div className="text-2xl font-bold">₹{totals.today}</div>
          <div className="text-xs opacity-60 mt-2">Items: {expenses.filter((e) => e.date === todayISO).length}</div>
        </div>

        <div className="glass p-5 rounded-2xl">
          <div className="text-sm opacity-70">This Week</div>
          <div className="text-2xl font-bold">₹{totals.week}</div>
          <div className="text-xs opacity-60 mt-2">Change vs last week: {insights.weekChange >= 0 ? `+${insights.weekChange}%` : `${insights.weekChange}%`}</div>
        </div>

        <div className="glass p-5 rounded-2xl">
          <div className="text-sm opacity-70">This Month</div>
          <div className="text-2xl font-bold">₹{totals.month}</div>
          <div className="text-xs opacity-60 mt-2">Top: {insights.topCat ? `${insights.topCat.name} (₹${insights.topCat.amount})` : "—"}</div>
        </div>

        <div className="glass p-5 rounded-2xl">
          <div className="text-sm opacity-70">All Time</div>
          <div className="text-2xl font-bold">₹{totals.all}</div>
          <div className="text-xs opacity-60 mt-2">Projection: ₹{insights.projectedMonth} {insights.willExceedLimit ? `• Exceeds limit by ₹${insights.exceedBy}` : ""}</div>
        </div>
      </div>

      {/* Charts area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
        <div className="glass p-3 sm:p-4 rounded-xl md:col-span-2 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
            <h3 className="font-semibold text-sm sm:text-base">Spending Trend (last 14 days)</h3>
            <div className="text-xs sm:text-sm opacity-70">{tab} view</div>
          </div>
          <div style={{ height: '250px', minHeight: '250px' }}>
            <Line data={trendData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="glass p-3 sm:p-4 rounded-xl overflow-hidden">
          <h3 className="font-semibold mb-3 text-sm sm:text-base">Category Breakdown (filtered)</h3>
          {Object.keys(categoryTotalsFiltered).length ? (
            <div style={{ height: '200px', minHeight: '200px' }}>
              <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#fff', font: { size: 12 } } } } }} />
            </div>
          ) : (
            <div className="text-xs sm:text-sm opacity-60">No data in this view</div>
          )}
          <div className="mt-3 text-xs sm:text-sm">
            {Object.entries(categoryTotalsFiltered).sort((a,b)=>b[1]-a[1]).map(([k,v])=> (
              <div key={k} className="flex justify-between opacity-80 mb-1">
                <div className="truncate pr-2">{k}</div>
                <div className="flex-shrink-0">₹{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Period breakdown */}
      <div className="glass p-3 sm:p-4 rounded-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
          <h3 className="font-semibold text-sm sm:text-base">When do you spend most?</h3>
          <div className="text-xs sm:text-sm opacity-70">Period breakdown</div>
        </div>
        <div style={{ height: '250px', minHeight: '250px' }}>
          <Bar data={periodData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
        <div className="mt-3 text-xs sm:text-sm opacity-70 break-words">Morning: 5am–12pm • Afternoon: 12pm–5pm • Evening: 5pm–10pm • Night: 10pm–5am</div>
      </div>

      {/* insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass p-3 sm:p-4 rounded-xl">
          <h4 className="font-semibold text-sm sm:text-base">Smart Insights</h4>
          <ul className="mt-3 text-xs sm:text-sm space-y-2 opacity-80">
            <li className="break-words">{insights.weekChange >= 0 ? `You spent ${insights.weekChange}% more this week vs last week.` : `You spent ${Math.abs(insights.weekChange)}% less this week — nice!`}</li>
            <li className="break-words">{insights.topCat ? `${insights.topCat.name} is your top category this month (${insights.topCatShare}% of month).` : "No dominant category this month."}</li>
            <li className="break-words">Projected month total: <strong>₹{insights.projectedMonth}</strong>{insights.willExceedLimit ? <span className="text-red-300"> — will exceed limit by ₹{insights.exceedBy}</span> : ""}</li>
          </ul>
        </div>

        <div className="glass p-3 sm:p-4 rounded-xl">
          <h4 className="font-semibold text-sm sm:text-base">Top categories (this month)</h4>
          <div className="mt-3 space-y-2 text-xs sm:text-sm">
            {topCategoriesMonth.length ? topCategoriesMonth.map(([k,v]) => (
              <div key={k} className="flex justify-between">
                <div className="truncate pr-2">{k}</div>
                <div className="flex-shrink-0">₹{v}</div>
              </div>
            )) : <div className="opacity-70">No category data</div>}
          </div>
        </div>

        <div className="glass p-3 sm:p-4 rounded-xl">
          <h4 className="font-semibold text-sm sm:text-base">Quick Controls</h4>
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <button className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm ${tab === "Today" ? "bg-white/10" : "bg-white/5"}`} onClick={()=>setTab("Today")}>Today</button>
              <button className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm ${tab === "Week" ? "bg-white/10" : "bg-white/5"}`} onClick={()=>setTab("Week")}>Week</button>
              <button className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm ${tab === "Month" ? "bg-white/10" : "bg-white/5"}`} onClick={()=>setTab("Month")}>Month</button>
              <button className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm ${tab === "All" ? "bg-white/10" : "bg-white/5"}`} onClick={()=>setTab("All")}>All</button>
            </div>

            <div className="text-xs sm:text-sm opacity-80 break-words">Selected total: <strong>₹{filtered.reduce((s,x)=>s+x.amount,0)}</strong></div>
          </div>
        </div>
      </div>

      {/* Add / Edit form */}
      <div className="glass p-3 sm:p-4 rounded-xl flex flex-col md:flex-row gap-2 sm:gap-3 items-stretch md:items-center">
        <input placeholder="Title" className="px-3 py-2 rounded-lg text-black flex-1 text-sm sm:text-base" value={title} onChange={(e)=>setTitle(e.target.value)} />
        <select className="px-3 py-2 rounded-lg text-black text-sm sm:text-base min-w-[120px]" value={category} onChange={(e)=>setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <input type="number" placeholder="Amount (₹)" className="px-3 py-2 rounded-lg text-black w-full md:w-28 text-sm sm:text-base" value={amount === "" ? "" : amount} onChange={(e)=>setAmount(e.target.value === "" ? "" : Number(e.target.value))} />
        <input type="date" className="px-3 py-2 rounded-lg text-black text-sm sm:text-base flex-1 md:flex-none" value={date} onChange={(e)=>setDate(e.target.value)} />
        <input type="time" className="px-3 py-2 rounded-lg text-black w-full md:w-36 text-sm sm:text-base" value={time} onChange={(e)=>setTime(e.target.value)} />
        <div className="flex gap-2">
          <button onClick={handleAddOrUpdate} className="btn-shine bg-gradient-to-r from-purple-500 to-pink-500 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm whitespace-nowrap flex-1 md:flex-none">{editing ? "Update" : "Add"}</button>
          {editing && <button onClick={()=>{ setEditing(null); setTitle(""); setAmount(""); setCategory(CATEGORIES[0]); }} className="px-3 sm:px-4 py-2 rounded-lg bg-white/10 text-xs sm:text-sm whitespace-nowrap">Cancel</button>}
        </div>
      </div>

      {/* List (filtered) */}
      <div className="space-y-3">
        {filtered.length === 0 && <div className="glass p-4 rounded-xl text-center text-sm sm:text-base">No expenses</div>}
        {filtered.map((e) => (
          <div key={e.id} className="glass p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm sm:text-base truncate">{e.title}</div>
              <div className="text-xs sm:text-sm opacity-70 break-words">{e.category} • {dayjs(e.date).format("DD MMM YYYY")} • {e.time}</div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <div className="font-semibold text-sm sm:text-base">₹{e.amount}</div>
              <div className="flex gap-2">
                <button onClick={()=>handleEdit(e)} className="text-white/80 px-2 py-1 rounded-md hover:bg-white/10" title="Edit"><FiEdit /></button>
                <button onClick={()=>handleDelete(e.id)} className="text-red-400 px-2 py-1 rounded-md hover:bg-red-400/20" title="Delete"><FiTrash2 /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
