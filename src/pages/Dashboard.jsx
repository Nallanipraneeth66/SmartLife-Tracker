// src/pages/Dashboard.jsx
import { useEffect, useState, useMemo } from "react";
import { FiCheckSquare, FiActivity, FiDollarSign } from "react-icons/fi";
import DashboardCharts from "../components/DashboardCharts";
import { getTasks } from "../api/taskApi";
import { getExpenses } from "../api/expensesApi";
import { getHealth, getHealthGoals } from "../api/healthApi";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext";

function sum(arr) { return arr.reduce((a, b) => a + b, 0); }
const CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Others"];

export default function Dashboard() {
  const { user } = useAuth();
  
  // Don't render until user is loaded
  if (!user || !user.id) {
    return null;
  }
  
  const userId = user.id;
  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [health, setHealth] = useState([]);
  const [healthGoals, setHealthGoals] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const [tasksRes, expensesRes, healthRes, goalsRes] = await Promise.all([
          getTasks(userId), getExpenses(userId), getHealth(userId), getHealthGoals()
        ]);
        setTasks(tasksRes.data || []);
        setExpenses(expensesRes.data || []);
        setHealth(healthRes.data || []);
        const goalsData = Array.isArray(goalsRes.data) ? (goalsRes.data[0] ?? null) : goalsRes.data;
        setHealthGoals(goalsData);
      } catch (err) {
        console.error("Dashboard API Error:", err);
        console.error("Failed endpoint:", err.config?.url);
        console.error("Error response:", err.response?.data);
        console.error("Error status:", err.response?.status);
        // Set empty arrays on error to prevent crashes
        setTasks([]);
        setExpenses([]);
        setHealth([]);
        setHealthGoals(null);
      } finally {
        setLoading(false);
      }
    }
    if (userId) loadAll();
  }, [userId]);

  const todayISO = dayjs().format("YYYY-MM-DD");
  const startOfWeek = dayjs().startOf("week").format("YYYY-MM-DD");
  const endOfWeek = dayjs().endOf("week").format("YYYY-MM-DD");
  const last7days = [...Array(7)].map((_, i) => dayjs().subtract(6 - i, "day").format("YYYY-MM-DD"));

  // Helper function for habit streak
  function habitStreak(h) {
    if (!Array.isArray(h.timeSpent)) return 0;
    let streak = 0, maxStreak = 0;
    const sorted = [...h.timeSpent].sort((a, b) => a.date.localeCompare(b.date));
    let prev = null;
    for (const d of sorted) {
      if (d.minutes >= (h.timeGoalMinutes || 1)) {
        if (prev && dayjs(d.date).diff(dayjs(prev), 'day') === 1) streak++;
        else streak = 1;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 0;
      }
      prev = d.date;
    }
    return maxStreak;
  }

  // --- Card hover styling (add class for each) ---
  const baseCard = "p-6 rounded-3xl bg-black/30 border-2 backdrop-blur-xl shadow-lg transition-all duration-200 group";
  const hoverOutlines = [
    "group hover:border-blue-400 hover:shadow-blue-400/80",
    "group hover:border-purple-400 hover:shadow-purple-400/80",
    "group hover:border-red-400 hover:shadow-red-400/80",
    "group hover:border-green-400 hover:shadow-green-400/80"
  ];

  // Filter data to only show current user's data
  const userTasks = tasks.filter(t => t.userId === userId);
  const userExpenses = expenses.filter(e => e.userId === userId);
  const userHealth = health.filter(h => h.userId === userId);

  // Recalculate with filtered data
  const incompleteTasks = userTasks.filter(t => !t.completed);
  const tasksDueToday = userTasks.filter(t => (t.deadline === todayISO && !t.completed));
  const habits = userTasks.filter(t => t.isHabit);
  const habitsDoneToday = habits.filter(h => {
    if (!Array.isArray(h.timeSpent)) return false;
    const entry = h.timeSpent.find(ts => ts.date === todayISO);
    return entry && entry.minutes >= (h.timeGoalMinutes||1);
  });
  const longestHabitStreak = Math.max(0, ...habits.map(h => habitStreak(h)));
  const totalHabitMinutesToday = sum(habits.map(h => {
    if (!Array.isArray(h.timeSpent)) return 0;
    const entry = h.timeSpent.find(t => t.date === todayISO);
    return entry ? entry.minutes : 0;
  }));
  const completedTasksToday = userTasks.filter(t => t.deadline === todayISO && t.completed).length;
  const productivityScore = completedTasksToday + habitsDoneToday.length;
  const expensesThisWeek = userExpenses.filter(e => e.date >= startOfWeek && e.date <= endOfWeek);
  const weeklySpent = sum(expensesThisWeek.map(e => e.amount));
  const todayExpenses = userExpenses.filter(e => e.date === todayISO);
  const todaySpent = sum(todayExpenses.map(e => e.amount));
  const categoryBreakdown = {};
  CATEGORIES.forEach(cat => categoryBreakdown[cat] = 0);
  expensesThisWeek.forEach(e => {
    if (CATEGORIES.includes(e.category)) categoryBreakdown[e.category] += e.amount;
    else categoryBreakdown["Others"] += e.amount;
  });
  let expensiveCat = null, maxCatValue = 0;
  Object.entries(categoryBreakdown).forEach(([cat, val]) => {
    if (val > maxCatValue) { maxCatValue = val; expensiveCat = cat; }
  });
  const last7ExpenseData = last7days.map(date => {
    const sumVal = sum(userExpenses.filter(e => e.date === date).map(e => e.amount));
    return sumVal;
  });
  const todayHealth = userHealth.find(h => h.date === todayISO) || { water:0, sleep:0, steps:0 };
  
  // Calculate health score using same formula as HealthPage
  const healthScore = useMemo(() => {
    if (!healthGoals) return 0;
    const pct = (val, target) => (target > 0 ? Math.min(100, (val / target) * 100) : 0);
    const wPct = pct((todayHealth.water || 0), healthGoals.waterMl);
    const sPct = pct((todayHealth.sleep || 0), healthGoals.sleepHours);
    const stPct = pct((todayHealth.steps || 0), healthGoals.steps);
    const score = Math.round(wPct * 0.3 + sPct * 0.4 + stPct * 0.3);
    return Math.min(100, Math.max(0, score));
  }, [todayHealth, healthGoals]);
  const healthByDate = {};
  userHealth.forEach(r => { if (r.date) healthByDate[r.date] = r; });
  const healthWeekData = {
    labels: last7days.map(date => dayjs(date).format("DD MMM")),
    water: last7days.map(date => (healthByDate[date]?.water || 0)),
    sleep: last7days.map(date => (healthByDate[date]?.sleep || 0)),
    steps: last7days.map(date => (healthByDate[date]?.steps || 0))
  };
  const habitMinutesData = last7days.map(date => sum(habits.map(h =>{
    if (!Array.isArray(h.timeSpent)) return 0;
    const entry = h.timeSpent.find(t => t.date === date);
    return entry ? entry.minutes : 0;
  })));
  const categoryDataEntries = Object.entries(categoryBreakdown).filter(([,v])=>v>0);

  return (
    <div className="min-h-screen px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 bg-gradient-to-br from-black via-[#151028] to-black bg-fixed">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 md:space-y-10">
        {/* Welcome Message */}
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text mb-2">
            Welcome back, {user.name || "User"}! 👋
          </h1>
          <p className="text-sm sm:text-base text-white/70">Here's your overview for today</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
          <div className={`${baseCard} ${hoverOutlines[0]}`}> {/* Tasks */}
            <div className="flex items-center gap-4">
              <FiCheckSquare size={36} className="text-blue-400" />
              <div>
                <div className="opacity-80 text-base">Due Today</div>
                <div className="text-3xl font-bold">{tasksDueToday.length}</div>
                <div className="text-xs opacity-70 mt-1">Incomplete: {incompleteTasks.length}</div>
              </div>
            </div>
          </div>
          <div className={`${baseCard} ${hoverOutlines[1]}`}> {/* Habits */}
            <div className="flex items-center gap-4">
              <FiActivity size={36} className="text-purple-400" />
              <div>
                <div className="opacity-80 text-base">Habits</div>
                <div className="text-3xl font-bold">{habits.length}</div>
                <div className="text-xs opacity-70 mt-1">Completed today: {habitsDoneToday.length}</div>
              </div>
            </div>
          </div>
          <div className={`${baseCard} ${hoverOutlines[2]}`}> {/* Expenses */}
            <div className="flex items-center gap-4">
              <FiDollarSign size={36} className="text-red-400" />
              <div>
                <div className="opacity-80 text-base">Spent This Week</div>
                <div className="text-3xl font-bold">₹{weeklySpent}</div>
                <div className="text-xs opacity-70 mt-1">Today: ₹{todaySpent}</div>
              </div>
            </div>
          </div>
          <div className={`${baseCard} ${hoverOutlines[3]}`}> {/* Health */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-4">
                <FiActivity size={36} className="text-green-400" />
                <div>
                  <div className="opacity-80 text-base">Health</div>
                  <div className="text-3xl font-bold">{healthScore}%</div>
                </div>
              </div>
              <div className="text-xs opacity-80 mt-2 flex flex-wrap gap-2 items-center">
                <span className="">💧 {todayHealth.water || 0}ml</span>
                <span className="">😴 {todayHealth.sleep || 0}h</span>
                <span className="">🚶 {todayHealth.steps || 0}s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 mt-4 sm:mt-6">
          <div className="w-full min-w-0 overflow-hidden">
            <DashboardCharts
              weeklyExpenseData={{
                labels: last7days.map(date => dayjs(date).format("DD MMM")),
                data: last7ExpenseData
              }}
              categoryData={{
                labels: categoryDataEntries.map(([x])=>x),
                data: categoryDataEntries.map(([_, y])=>y)
              }}
              habitMinutesData={{
                labels: last7days.map(date => dayjs(date).format("DD MMM")),
                data: habitMinutesData
              }}
              healthWeekData={healthWeekData}
            />
          </div>
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-purple-800/40 p-4 sm:p-5 md:p-6 flex flex-col gap-3 sm:gap-4 text-sm sm:text-base min-w-0">
            <div className="font-semibold text-base sm:text-lg mb-1">Smart Insights</div>
            <div className="flex flex-col gap-2 opacity-90 text-xs sm:text-sm">
              <div className="break-words">Total tasks: <b>{userTasks.length}</b> • Completed: <b>{userTasks.filter(t => t.completed).length}</b> • Missed: <b>{userTasks.filter(t => Object.keys(t.missedForDate || {}).length > 0).length}</b></div>
              <div>Habits achieved today: <b>{habitsDoneToday.length}</b> / {habits.length}</div>
              <div className="break-words">Most expensive category (this week): <b>{expensiveCat || '—'}</b> {maxCatValue > 0 ? `(₹${maxCatValue})` : ''}</div>
              <div>Longest habit streak: <b>{longestHabitStreak} days</b></div>
              <div>Total habit minutes today: <b>{totalHabitMinutesToday}m</b></div>
              <div>Productivity score (today): <b>{productivityScore}</b></div>
            </div>
            <div className="flex flex-col gap-1 mt-3 sm:mt-4 text-xs opacity-60">
              <div className="break-words">Water goal (8c): <b>30pt</b> • Sleep(8h): <b>40pt</b> • Steps(6000): <b>30pt</b></div>
              <div className="break-words">Light/Dark mode: Use top-right toggle in Navbar</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
