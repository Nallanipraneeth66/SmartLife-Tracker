import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

import {
  getHealth,
  addHealthData,
  deleteHealthData,
  updateHealthData,
  getHealthGoals,
  updateHealthGoals
} from "../api/healthApi";

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

import { FiSave, FiTrash, FiEdit } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement);

export default function HealthPage() {
  const { user } = useAuth();
  
  // Don't render until user is loaded
  if (!user || !user.id) {
    return null;
  }
  
  const userId = user.id;
  const [records, setRecords] = useState([]);
  const [goals, setGoals] = useState(null);
  const [waterInput, setWaterInput] = useState("");
  const [sleepInput, setSleepInput] = useState("");
  const [stepsInput, setStepsInput] = useState("");
  const [editingGoals, setEditingGoals] = useState(false);
  const [localGoals, setLocalGoals] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const todayISO = dayjs().format("YYYY-MM-DD");
  const load = async () => {
    try {
      const r = await getHealth(userId);
      setRecords(Array.isArray(r.data) ? r.data : []);
      const g = await getHealthGoals();
      const gData = Array.isArray(g.data) ? (g.data[0] ?? null) : g.data;
      setGoals(gData);
      setLocalGoals(gData ? { ...gData } : null);
    } catch (err) {
      console.error("Health load error", err);
    }
  };
  useEffect(() => {
    if (userId) load();
  }, [userId]);
  const cupSize = () => goals?.cupSizeMl ?? 250;
  const cupsToMl = (cupsStr) => {
    const cups = Number(cupsStr || 0);
    return Math.round(cups * cupSize());
  };
  const handleSave = async () => {
    if (!goals) {
      return alert("Please set goals first (Edit Goals) so the app knows cup size.");
    }
    if (!waterInput && !sleepInput && !stepsInput) {
      return alert("Enter at least one value before saving.");
    }
    const existing = records.find((r) => r.date === todayISO);
    const addWaterMl = cupsToMl(waterInput);
    const addSleepH = Number(sleepInput || 0);
    const addSteps = Number(stepsInput || 0);
    if (existing) {
      const updated = {
        ...existing,
        water: (existing.water || 0) + addWaterMl,
        sleep: Number((existing.sleep || 0) + addSleepH),
        steps: (existing.steps || 0) + addSteps,
      };
      try {
        await updateHealthData(existing.id, updated, userId);
        await load();
      } catch (err) {
        console.error("update failed", err);
        alert("Update failed");
      }
    } else {
      const payload = {
        water: addWaterMl,
        sleep: addSleepH,
        steps: addSteps,
        date: todayISO,
      };
      try {
        await addHealthData(payload, userId);
        await load();
      } catch (err) {
        console.error("add failed", err);
        alert("Save failed");
      }
    }
    setWaterInput("");
    setSleepInput("");
    setStepsInput("");
  };
  const handleDelete = async (id) => {
    if (!id) return;
    if (!confirm("Delete this entry?")) return;
    await deleteHealthData(id, userId);
    await load();
  };
  const openEditModal = (r) => {
    setEditRecord({ ...r });
    setEditModalOpen(true);
  };
  const saveEditRecord = async () => {
    if (!editRecord || !editRecord.id) return;
    const payload = {
      ...editRecord,
      water: Number(editRecord.water || 0),
      sleep: Number(editRecord.sleep || 0),
      steps: Number(editRecord.steps || 0),
    };
    await updateHealthData(editRecord.id, payload, userId);
    setEditModalOpen(false);
    setEditRecord(null);
    await load();
  };
  const saveGoals = async () => {
    if (!localGoals) return;
    await updateHealthGoals(localGoals);
    setGoals({ ...localGoals });
    setEditingGoals(false);
  };
  const last7 = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => dayjs().subtract(6 - i, "day").format("YYYY-MM-DD"));
  }, []);
  const recordsMap = useMemo(() => {
    const m = {};
    records.forEach((r) => {
      if (!m[r.date]) m[r.date] = { ...r };
      else {
        m[r.date] = {
          ...m[r.date],
          water: (m[r.date].water || 0) + (r.water || 0),
          sleep: (m[r.date].sleep || 0) + (r.sleep || 0),
          steps: (m[r.date].steps || 0) + (r.steps || 0),
        };
      }
    });
    return m;
  }, [records]);
  const weekly = useMemo(() => {
    return {
      dates: last7.map((d) => dayjs(d).format("DD MMM")),
      water: last7.map((d) => recordsMap[d]?.water ?? 0),
      sleep: last7.map((d) => recordsMap[d]?.sleep ?? 0),
      steps: last7.map((d) => recordsMap[d]?.steps ?? 0),
    };
  }, [recordsMap, last7]);
  const weeklyPercent = useMemo(() => {
    if (!goals) {
      return {
        dates: weekly.dates,
        water: weekly.water.map(() => 0),
        sleep: weekly.sleep.map(() => 0),
        steps: weekly.steps.map(() => 0),
      };
    }
    const pct = (v, t) => (t > 0 ? Math.min(100, Math.round((v / t) * 100)) : 0);
    return {
      dates: weekly.dates,
      water: weekly.water.map((ml) => pct(ml, goals.waterMl)),
      sleep: weekly.sleep.map((h) => pct(h, goals.sleepHours)),
      steps: weekly.steps.map((s) => pct(s, goals.steps)),
    };
  }, [weekly, goals]);
  const todayRecord = recordsMap[todayISO] ?? null;
  const TodayScore = useMemo(() => {
    if (!goals) return 0;
    const pct = (val, target) => (target > 0 ? Math.min(100, (val / target) * 100) : 0);
    const wPct = pct((todayRecord?.water ?? 0), goals.waterMl);
    const sPct = pct((todayRecord?.sleep ?? 0), goals.sleepHours);
    const stPct = pct((todayRecord?.steps ?? 0), goals.steps);
    const score = Math.round(wPct * 0.3 + sPct * 0.4 + stPct * 0.3);
    return Math.min(100, Math.max(0, score));
  }, [todayRecord, goals]);
  const doughnutData = {
    labels: ["Completed", "Remaining"],
    datasets: [
      {
        data: [TodayScore, Math.max(0, 100 - TodayScore)],
        backgroundColor: ["#7cf5d6", "#162226"],
      },
    ],
  };
  const displayWater = (ml) => {
    if (!goals) return `${ml} ml`;
    const cups = ml / goals.cupSizeMl;
    return `${cups.toFixed(1)} cups (${ml} ml)`;
  };
  const historySorted = useMemo(() => {
    return Object.values(recordsMap)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [recordsMap]);
  return (
    <div className="p-3 sm:p-4 md:p-6 text-white space-y-6 sm:space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Health Tracker</h1>
      <div className="glass p-4 sm:p-5 md:p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="w-full md:w-auto text-center md:text-left">
          <div className="text-xs sm:text-sm opacity-70">Today's Score</div>
          <div className="text-2xl sm:text-3xl font-bold">{TodayScore}%</div>
          <div className="text-xs sm:text-sm opacity-70 mt-1 break-words">
            {todayRecord ? (
              <>
                💧 {displayWater(todayRecord.water)} • 😴 {todayRecord.sleep} hrs • 🚶 {todayRecord.steps} steps
              </>
            ) : (
              "No data for today yet."
            )}
          </div>
        </div>
        <div className="w-full sm:w-auto flex justify-center md:justify-end" style={{ maxWidth: '120px', width: '120px', height: '120px' }}>
          <Doughnut data={doughnutData} options={{ maintainAspectRatio: true, responsive: true }} />
        </div>
      </div>
      <div className="glass p-4 sm:p-5 md:p-6 rounded-2xl">
        <div className="text-xs sm:text-sm opacity-70 mb-3">Quick Add (you can log water, sleep or steps separately and they will be merged for the day)</div>
        <div className="mt-3 flex flex-col md:flex-row gap-3">
          <input
            placeholder={`Water (cups, ${cupSize()} ml)`} type="number"
            className="w-full p-2 sm:p-3 rounded-lg text-black text-sm sm:text-base"
            value={waterInput} onChange={(e) => setWaterInput(e.target.value)}
          />
          <input
            placeholder="Sleep (hours)" type="number" step="0.1"
            className="w-full p-2 sm:p-3 rounded-lg text-black text-sm sm:text-base"
            value={sleepInput} onChange={(e) => setSleepInput(e.target.value)}
          />
          <input
            placeholder="Steps" type="number"
            className="w-full p-2 sm:p-3 rounded-lg text-black text-sm sm:text-base"
            value={stepsInput} onChange={(e) => setStepsInput(e.target.value)}
          />
          <button onClick={handleSave} className="btn-shine bg-indigo-500 px-4 sm:px-6 py-2 sm:py-3 rounded-full flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap">
            <FiSave /> Save
          </button>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={() => { setEditingGoals(!editingGoals); setLocalGoals(goals ? { ...goals } : null); }}
                className="btn-shine bg-purple-500 px-4 py-2 rounded-full flex items-center gap-2">
          <FiEdit /> Edit Goals
        </button>
      </div>
      {editingGoals && localGoals && (
        <div className="glass p-4 rounded-xl space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold">Edit Goals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs sm:text-sm block mb-1">Water Goal (ml)</label>
              <input type="number" className="text-black p-2 rounded-md w-full text-sm sm:text-base"
                     value={localGoals.waterMl}
                     onChange={(e) => setLocalGoals({ ...localGoals, waterMl: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs sm:text-sm block mb-1">Cup Size (ml)</label>
              <input type="number" className="text-black p-2 rounded-md w-full text-sm sm:text-base"
                     value={localGoals.cupSizeMl}
                     onChange={(e) => setLocalGoals({ ...localGoals, cupSizeMl: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs sm:text-sm block mb-1">Sleep Goal (hrs)</label>
              <input type="number" className="text-black p-2 rounded-md w-full text-sm sm:text-base"
                     value={localGoals.sleepHours}
                     onChange={(e) => setLocalGoals({ ...localGoals, sleepHours: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs sm:text-sm block mb-1">Steps Goal</label>
              <input type="number" className="text-black p-2 rounded-md w-full text-sm sm:text-base"
                     value={localGoals.steps}
                     onChange={(e) => setLocalGoals({ ...localGoals, steps: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button onClick={saveGoals} className="bg-green-500 px-4 py-2 rounded-full text-sm sm:text-base">Save</button>
            <button onClick={() => setEditingGoals(false)} className="bg-white/10 px-4 py-2 rounded-full text-sm sm:text-base">Cancel</button>
          </div>
        </div>
      )}
      <div className="glass p-4 sm:p-5 md:p-6 rounded-xl overflow-hidden">
        <h2 className="font-semibold mb-3 text-base sm:text-lg">Weekly Progress (% of Goal)</h2>
        <div className="w-full overflow-x-auto">
          <div style={{ minWidth: '300px', height: '300px' }}>
            <Bar data={{
              labels: weekly.dates,
              datasets: [
                { label: "Water (%)", data: weeklyPercent.water, backgroundColor: "#60a5fa" },
                { label: "Sleep (%)", data: weeklyPercent.sleep, backgroundColor: "#f472b6" },
                { label: "Steps (%)", data: weeklyPercent.steps, backgroundColor: "#4ade80" }
              ]
            }} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass p-4 rounded-xl overflow-hidden">
          <h3 className="mb-2 font-semibold text-sm sm:text-base">Water (ml)</h3>
          <div style={{ height: '200px' }}>
            <Bar data={{ labels: weekly.dates, datasets: [{ label: "Water", data: weekly.water, backgroundColor: "#60a5fa" }] }} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="glass p-4 rounded-xl overflow-hidden">
          <h3 className="mb-2 font-semibold text-sm sm:text-base">Sleep (hrs)</h3>
          <div style={{ height: '200px' }}>
            <Bar data={{ labels: weekly.dates, datasets: [{ label: "Sleep", data: weekly.sleep, backgroundColor: "#f472b6" }] }} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="glass p-4 rounded-xl overflow-hidden">
          <h3 className="mb-2 font-semibold text-sm sm:text-base">Steps</h3>
          <div style={{ height: '200px' }}>
            <Bar data={{ labels: weekly.dates, datasets: [{ label: "Steps", data: weekly.steps, backgroundColor: "#4ade80" }] }} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
      <div>
        <h2 className="text-lg sm:text-xl font-semibold mt-4 sm:mt-6">Past Entries</h2>
        <div className="space-y-3 mt-3">
          {historySorted.map((r) => (
            <div key={r.date} className="glass p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm sm:text-base">{dayjs(r.date).format("DD MMM YYYY")}</div>
                <div className="text-xs sm:text-sm opacity-80 break-words">💧 {displayWater(r.water)} | 😴 {r.sleep} hrs | 🚶 {r.steps} steps</div>
              </div>
              <div className="flex gap-2 sm:gap-3 items-center">
                <button onClick={() => openEditModal(r)} className="px-2 sm:px-3 py-1 sm:py-2 rounded-md bg-white/5 text-xs sm:text-sm whitespace-nowrap"> <FiEdit className="inline mr-1" /> Edit </button>
                <button onClick={() => handleDelete(r.id)} className="text-red-400 text-lg sm:text-xl px-2" title="Delete"> <FiTrash /> </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {editModalOpen && editRecord && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setEditModalOpen(false); setEditRecord(null); }} />
          <div onClick={(e) => e.stopPropagation()} className="relative z-10 glass p-4 sm:p-6 rounded-xl w-full max-w-md">
            <h3 className="text-base sm:text-lg font-semibold mb-3 break-words">Edit Entry — {dayjs(editRecord.date).format("DD MMM YYYY")}</h3>
            <label className="text-xs sm:text-sm block mb-1">Water (ml)</label>
            <input type="number" value={editRecord.water} onChange={(e) => setEditRecord({ ...editRecord, water: Number(e.target.value) })} className="p-2 rounded-md w-full text-black text-sm sm:text-base mb-2" />
            <label className="text-xs sm:text-sm block mb-1">Sleep (hrs)</label>
            <input type="number" step="0.1" value={editRecord.sleep} onChange={(e) => setEditRecord({ ...editRecord, sleep: Number(e.target.value) })} className="p-2 rounded-md w-full text-black text-sm sm:text-base mb-2" />
            <label className="text-xs sm:text-sm block mb-1">Steps</label>
            <input type="number" value={editRecord.steps} onChange={(e) => setEditRecord({ ...editRecord, steps: Number(e.target.value) })} className="p-2 rounded-md w-full text-black text-sm sm:text-base mb-4" />
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button onClick={() => { setEditModalOpen(false); setEditRecord(null); }} className="bg-white/10 px-4 py-2 rounded-full text-sm sm:text-base">Cancel</button>
              <button onClick={saveEditRecord} className="bg-green-500 px-4 py-2 rounded-full text-sm sm:text-base">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
