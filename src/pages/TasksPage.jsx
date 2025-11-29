// src/pages/TasksPage.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { getTasks, addTask, updateTask, deleteTask } from "../api/taskApi";
import { FiTrash2, FiEdit, FiCheckCircle, FiRepeat } from "react-icons/fi";
import dayjs from "dayjs";

// Chart.js
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

import { useAuth } from "../context/AuthContext";

export default function TasksPage() {
  const { user } = useAuth();
  
  // Don't render until user is loaded
  if (!user || !user.id) {
    return null;
  }
  
  const userId = user.id;

  // Core states
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Low");
  const [editing, setEditing] = useState(null);

  // Habit fields
  const [isHabit, setIsHabit] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [reminderTime, setReminderTime] = useState("18:00");
  const [repeatType, setRepeatType] = useState("none");
  const [repeatDays, setRepeatDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [timeGoal, setTimeGoal] = useState(30);

  // Log modal controls
  const [showLogModal, setShowLogModal] = useState(false);
  const [logTask, setLogTask] = useState(null);
  const [logMinutes, setLogMinutes] = useState(""); // string so typing doesn't show a leading "0"
  const [logSummary, setLogSummary] = useState("");

  // Mark Missed bottom sheet
  const [showMissedSheet, setShowMissedSheet] = useState(false);
  const [missedTask, setMissedTask] = useState(null);
  const [missedDate, setMissedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [missedReason, setMissedReason] = useState("");

  // Postpone modal
  const [showPostponeModal, setShowPostponeModal] = useState(false);
  const [postponeTask, setPostponeTask] = useState(null);
  const [postponeDate, setPostponeDate] = useState("");

  // Scheduler ref for reminders
  const schedRef = useRef({});

  // helper: load tasks (per-user)
  const loadTasks = useCallback(async () => {
    try {
      const res = await getTasks(userId);
      // Filter tasks to ensure only current user's tasks are shown
      const userTasks = (res.data || []).filter(task => task.userId === userId);
      setTasks(userTasks);
    } catch (err) {
      console.error("Failed to load tasks", err);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadTasks();
      // request notification permission on mount
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, [userId, loadTasks]);

  // build bar data for habit chart
  const habitProgressLast7 = (task) => {
    const days = Array.from({ length: 7 }, (_, i) => dayjs().subtract(i, "day").format("YYYY-MM-DD")).reverse();
    const logs = task.timeSpent || [];
    const goal = task.timeGoalMinutes || 0;
    return days.map((d) => {
      const entry = logs.find((x) => x.date === d);
      return {
        date: d,
        minutes: entry ? entry.minutes : 0,
        met: entry ? entry.minutes >= goal : false
      };
    });
  };

  const buildBarData = (task) => {
    const arr = habitProgressLast7(task);
    return {
      labels: arr.map((a) => a.date.slice(5)),
      datasets: [
        {
          label: "Minutes",
          data: arr.map((a) => a.minutes),
          backgroundColor: "#60a5fa"
        }
      ]
    };
  };

  // Utility CSS helper for weekday pills
  const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const pillClass = (active) =>
    `px-3 py-1 rounded-full text-sm ${active ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white" : "bg-white/5 text-white/70"}`;

  // render history
  const renderHistorySection = (task) => {
    const spent = task.timeSpent || [];
    const missed = task.missedForDate || {};
    const dates = new Set([...spent.map((s) => s.date), ...Object.keys(missed)]);
    const arr = Array.from(dates).sort((a, b) => (a < b ? 1 : -1));
    if (!arr.length) return <div className="text-sm opacity-70">No history yet</div>;
    return (
      <div className="mt-3 space-y-2">
        {arr.map((date) => {
          const entry = spent.find((s) => s.date === date);
          const missReason = missed[date];
          return (
            <div key={date} className="p-3 bg-white/5 rounded-lg flex justify-between">
              <div>
                <div className="font-semibold">{date}</div>
                {entry && <div className="text-sm opacity-80">Logged: {entry.minutes} min {entry.summary ? `• ${entry.summary}` : ""}</div>}
                {missReason && <div className="text-sm text-red-300">Missed: {missReason}</div>}
              </div>
              <div className="text-sm opacity-70">
                {entry ? "Completed" : missReason ? "Missed" : "No record"}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Notification helpers (priority-aware)
  const showReminderNotification = (task, message = null) => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") {
      Notification.requestPermission().catch(() => {});
      return;
    }
    try {
      const body = message || `${task.title} — ${task.isHabit ? "Habit" : "Task"} • Priority: ${task.priority}`;
      const notif = new Notification("Task Reminder", {
        body: body,
        tag: `task-${task.id}-${Date.now()}`,
        renotify: true,
        icon: "/vite.svg"
      });
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (e) {
      console.warn("Notification failed:", e);
    }
  };

  // schedule reminders when tasks change
  useEffect(() => {
    // clear previous timers
    Object.values(schedRef.current).forEach((id) => clearTimeout(id));
    schedRef.current = {};

    // Only schedule for current user's tasks
    const userTasks = tasks.filter(t => t.userId === userId);

    userTasks.forEach((t) => {
      if (!t.reminderTime || t.completed) return;

      // skip postponed future
      if (t.postponedUntil && dayjs(t.postponedUntil).isAfter(dayjs(), "day")) return;

      const [hh, mm] = (t.reminderTime || "18:00").split(":").map(Number);
      let candidate = dayjs().hour(hh).minute(mm).second(0).millisecond(0);

      // if candidate passed, compute next according to repeat
      if (candidate.isBefore(dayjs())) {
        if (t.repeat?.type === "Today") {
          candidate = candidate.add(1, "day");
        } else if (t.repeat?.type === "weekly" && Array.isArray(t.repeat.days) && t.repeat.days.length) {
          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          let next = candidate.add(1, "day");
          for (let i = 0; i < 8; i++) {
            if (t.repeat.days.includes(dayNames[next.day()])) break;
            next = next.add(1, "day");
          }
          candidate = next.hour(hh).minute(mm).second(0).millisecond(0);
        } else {
          // one-time and already passed -> don't schedule
          return;
        }
      }

      // schedule main reminder
      const scheduleAt = (time, customMessage = null) => {
        const ms = time.diff(dayjs());
        if (ms <= 0 || ms > Number.MAX_SAFE_INTEGER) return null;
        const id = setTimeout(() => {
          showReminderNotification(t, customMessage);
          loadTasks();
        }, ms);
        return id;
      };

      // Priority-based notification scheduling:
      // HIGH PRIORITY → notify 5 min before + at time
      // MEDIUM PRIORITY → notify at time
      // LOW PRIORITY → notify only once at time
      if (t.priority === "High") {
        // 5 minutes before
        const fiveMinBefore = candidate.subtract(5, "minute");
        const id1 = scheduleAt(fiveMinBefore, `${t.title} — Reminder in 5 minutes!`);
        if (id1) schedRef.current[`pre-${t.id}`] = id1;
        
        // At time
        const mainId = scheduleAt(candidate, `${t.title} — Time to do it now!`);
        if (mainId) schedRef.current[`main-${t.id}`] = mainId;
      } else if (t.priority === "Medium") {
        // At time only
        const mainId = scheduleAt(candidate);
        if (mainId) schedRef.current[`main-${t.id}`] = mainId;
      } else {
        // LOW priority - at time only
        const mainId = scheduleAt(candidate);
        if (mainId) schedRef.current[`main-${t.id}`] = mainId;
      }
    });

    return () => {
      Object.values(schedRef.current).forEach((id) => clearTimeout(id));
    };
  }, [tasks, userId, loadTasks]);

  // Add or update task (with confirm)
  const handleAddOrUpdate = async () => {
    if (!title.trim()) return alert("Please enter a title.");

    const payload = {
      title: title.trim(),
      priority,
      completed: editing ? editing.completed : false,
      isHabit,
      createdAt: editing?.createdAt || new Date().toISOString(),
      deadline: deadline || null,
      reminderTime: reminderTime || null,
      repeat: repeatType === "none" ? null : { type: repeatType, days: repeatDays },
      timeGoalMinutes: isHabit ? timeGoal : null,
      timeSpent: editing?.timeSpent || [],
      postponedUntil: editing?.postponedUntil || null,
      notes: editing?.notes || "",
      missedForDate: editing?.missedForDate || {},
      userId: userId // Always include userId
    };

    try {
      if (editing) {
        await updateTask(editing.id, payload, userId);
      } else {
        await addTask(payload, userId);
      }
      // reset
      setTitle("");
      setPriority("Low");
      setIsHabit(false);
      setDeadline("");
      setReminderTime("18:00");
      setRepeatType("none");
      setRepeatDays(["Mon", "Tue", "Wed", "Thu", "Fri"]);
      setTimeGoal(30);
      setEditing(null);
      await loadTasks();
      alert("Saved ✔");
    } catch (err) {
      console.error("save error", err);
      alert("Save failed");
    }
  };

  const handleEdit = (task) => {
    setEditing(task);
    setTitle(task.title);
    setPriority(task.priority || "Low");
    setIsHabit(Boolean(task.isHabit));
    setDeadline(task.deadline || "");
    setReminderTime(task.reminderTime || "18:00");
    setRepeatType(task.repeat?.type || "none");
    setRepeatDays(task.repeat?.days || ["Mon", "Tue", "Wed", "Thu", "Fri"]);
    setTimeGoal(task.timeGoalMinutes || 30);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCompleteToggle = async (task) => {
    if (!window.confirm(task.completed ? "Mark task as incomplete?" : "Mark this task as complete?")) return;
    try {
      await updateTask(task.id, { ...task, completed: !task.completed, userId }, userId);
      await loadTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm("Delete this task permanently?")) return;
    try {
      await deleteTask(id, userId);
      await loadTasks();
    } catch (err) {
      console.error(err);
    }
  };

  // Log minutes (show input as empty while typing)
  const openLogModal = (task) => {
    setLogTask(task);
    setLogMinutes(""); // empty so typing looks clean
    setLogSummary("");
    setShowLogModal(true);
  };

  const saveLog = async () => {
    if (!logTask) return;
    if (!logMinutes || Number(logMinutes) <= 0) {
      alert("Please enter valid minutes");
      return;
    }
    
    const minutes = Number(logMinutes);
    const date = dayjs().format("YYYY-MM-DD");
    const existing = [...(logTask.timeSpent || [])];
    const idx = existing.findIndex((t) => t.date === date);
    
    let updatedMinutes = minutes;
    let updatedSummary = logSummary || "";
    
    if (idx >= 0) {
      updatedMinutes = existing[idx].minutes + minutes;
      updatedSummary = (existing[idx].summary || "") + (logSummary ? " ; " + logSummary : "");
      existing[idx] = { ...existing[idx], minutes: updatedMinutes, summary: updatedSummary };
    } else {
      existing.push({ date, minutes, summary: logSummary || "", missed: false, reason: "" });
    }

    // For habits: if goal reached, mark as completed for that day
    const goal = logTask.timeGoalMinutes || 0;
    const isGoalReached = logTask.isHabit && updatedMinutes >= goal;
    
    // If habit goal is reached, we don't mark the entire task as completed,
    // but we can track it in the timeSpent entry
    // The task itself remains active for future days

    try {
      await updateTask(logTask.id, { 
        ...logTask, 
        timeSpent: existing, 
        userId 
      }, userId);
      setShowLogModal(false);
      setLogTask(null);
      setLogMinutes("");
      setLogSummary("");
      await loadTasks();
      if (isGoalReached) {
        alert(`Log saved! Goal reached for today! 🎉`);
      } else {
        alert("Log saved");
      }
    } catch (err) {
      console.error(err);
      alert("Log save failed");
    }
  };

  // Mark missed sheet (only if not completed)
  const openMissedSheet = (task) => {
    if (task.completed) return; // don't allow missed on completed
    setMissedTask(task);
    setMissedDate(dayjs().format("YYYY-MM-DD"));
    setMissedReason("");
    setShowMissedSheet(true);
  };

  const markMissed = async () => {
    if (!missedTask) return;
    if (!window.confirm("Mark this task as missed for the selected date?")) return;
    const map = { ...(missedTask.missedForDate || {}) };
    map[missedDate] = missedReason || "No reason provided";
    try {
      await updateTask(missedTask.id, { ...missedTask, missedForDate: map, userId }, userId);
      setShowMissedSheet(false);
      setMissedTask(null);
      await loadTasks();
      alert("Marked missed");
    } catch (err) {
      console.error(err);
      alert("Failed to mark missed");
    }
  };

  // Postpone flow
  const openPostponeModal = (task) => {
    setPostponeTask(task);
    setPostponeDate(dayjs().add(1, "day").format("YYYY-MM-DD"));
    setShowPostponeModal(true);
  };

  const savePostpone = async () => {
    if (!postponeTask) return;
    if (!window.confirm("Save postpone date?")) return;
    try {
      await updateTask(postponeTask.id, { ...postponeTask, postponedUntil: postponeDate, userId }, userId);
      setShowPostponeModal(false);
      setPostponeTask(null);
      await loadTasks();
      alert("Postponed");
    } catch (err) {
      console.error(err);
      alert("Failed to postpone");
    }
  };

  // Filter tasks to only show current user's tasks
  const userTasks = tasks.filter(task => task.userId === userId);

  // UI render
  return (
    <div className="p-3 sm:p-4 md:p-6 text-white space-y-6 sm:space-y-8">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text mb-3 sm:mb-4">Manage Your Tasks & Habits</h1>

      {/* Add / edit form */}
      <div className="glass p-4 sm:p-5 md:p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
          <input className="px-3 sm:px-4 py-2 sm:py-3 rounded-xl w-full sm:flex-1 text-black text-sm sm:text-base" placeholder="Task title..." value={title} onChange={(e) => setTitle(e.target.value)} />
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-black text-sm sm:text-base w-full sm:w-auto min-w-[120px]">
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
          <label className="flex items-center gap-2 text-sm whitespace-nowrap">
            <input type="checkbox" checked={isHabit} onChange={(e) => setIsHabit(e.target.checked)} />
            Habit
          </label>
          <button onClick={handleAddOrUpdate} className="px-4 sm:px-5 py-2 sm:py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-sm sm:text-base whitespace-nowrap">
            {editing ? "Update" : "Add"}
          </button>
        </div>

        {isHabit && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <div>
              <label className="text-xs sm:text-sm">Daily Goal (minutes)</label>
              <input type="number" value={timeGoal} onChange={(e) => setTimeGoal(Number(e.target.value))} className="text-black p-2 rounded-md w-full text-sm sm:text-base" />
            </div>

            <div>
              <label className="text-xs sm:text-sm">Repeat</label>
              <select value={repeatType} onChange={(e) => setRepeatType(e.target.value)} className="text-black p-2 rounded-md w-full text-sm sm:text-base">
                <option value="Today">Daily</option>
                <option value="weekly">Weekly (select days)</option>
                <option value="none">None</option>
              </select>
            </div>

            <div>
              <label className="text-xs sm:text-sm">Reminder</label>
              <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className="text-black p-2 rounded-md w-full text-sm sm:text-base" />
            </div>

            <div>
              <label className="text-xs sm:text-sm">Deadline</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="text-black p-2 rounded-md w-full text-sm sm:text-base" />
            </div>

            {repeatType === "weekly" && (
              <div className="sm:col-span-2 md:col-span-4 flex gap-2 flex-wrap mt-2">
                {WEEKDAYS.map((d) => {
                  const active = repeatDays.includes(d);
                  return (
                    <button key={d} className={pillClass(active)} onClick={() => setRepeatDays((prev) => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}>
                      <span className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"><FiRepeat className="text-xs sm:text-sm" /> {d}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!isHabit && (
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <div className="flex-1">
              <label className="text-xs sm:text-sm block mb-1">Reminder</label>
              <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className="text-black p-2 rounded-md w-full text-sm sm:text-base" />
            </div>
            <div className="flex-1">
              <label className="text-xs sm:text-sm block mb-1">Deadline</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="text-black p-2 rounded-md w-full text-sm sm:text-base" />
            </div>
          </div>
        )}
      </div>

      {/* Tasks list */}
      <div className="space-y-4">
        {userTasks.length === 0 && (
          <div className="glass p-5 rounded-2xl text-center opacity-70">
            No tasks yet. Create your first task above!
          </div>
        )}
        {userTasks.map((task) => (
          <div key={task.id || task._id || `${task.title}-${task.createdAt}`} className={`glass p-3 sm:p-4 md:p-5 rounded-2xl ${task.completed ? "opacity-60" : ""}`}>
            <div className="flex flex-col md:flex-row justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base sm:text-lg break-words">
                  {task.title} {task.isHabit && <span className="text-xs sm:text-sm opacity-70">• Habit</span>}
                </p>
                <div className="text-xs sm:text-sm opacity-70 flex flex-wrap gap-1 sm:gap-2 items-center mt-1">
                  <div className="whitespace-nowrap">Priority: <span className={task.priority === "High" ? "text-red-300 font-semibold" : task.priority === "Medium" ? "text-yellow-300" : "text-green-300"}>{task.priority}</span></div>
                  {task.deadline && <div className="whitespace-nowrap">• Deadline: {task.deadline}</div>}
                  {task.reminderTime && <div className="whitespace-nowrap">• Reminder: {task.reminderTime}</div>}
                  {task.postponedUntil && <div className="whitespace-nowrap break-words">• Postponed until {task.postponedUntil}</div>}
                  {/* Repeat days display */}
                  {task.repeat && task.repeat.type === "weekly" && Array.isArray(task.repeat.days) && (
                    <div className="mt-1 text-xs sm:text-sm opacity-80 w-full">
                      <span className="font-medium">Repeats on: </span>
                      <span className="break-words">{task.repeat.days.join(", ")}</span>
                    </div>
                  )}
                  {task.repeat && task.repeat.type === "Today" && (
                    <div className="mt-1 text-xs sm:text-sm opacity-80 w-full">
                      <span className="font-medium">Repeats: </span> Daily
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 items-start flex-shrink-0">
                <button onClick={() => handleCompleteToggle(task)} title="Toggle complete" className="p-2 rounded-md bg-white/5 hover:bg-white/10 transition">
                  <FiCheckCircle className="text-sm sm:text-base" />
                </button>
                <button onClick={() => handleEdit(task)} title="Edit" className="p-2 rounded-md bg-white/5 hover:bg-white/10 transition">
                  <FiEdit className="text-sm sm:text-base" />
                </button>
                <button onClick={() => handleDeleteTask(task.id)} title="Delete" className="p-2 rounded-md bg-white/5 text-red-400 hover:bg-red-400/20 transition">
                  <FiTrash2 className="text-sm sm:text-base" />
                </button>
              </div>
            </div>

            {/* habit block */}
            {task.isHabit && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-start md:items-center">
                <div className="w-full">
                  <div className="text-xs sm:text-sm opacity-70">Last 7 days (minutes)</div>
                  <div className="w-full max-w-full mt-2 overflow-hidden">
                    <div className="w-full" style={{ height: '200px', maxHeight: '200px' }}>
                      <Bar data={buildBarData(task)} options={{ 
                        plugins: { legend: { display: false } },
                        responsive: true,
                        maintainAspectRatio: false
                      }} />
                    </div>
                  </div>
                </div>

                <div className="w-full">
                  <div className="text-xs sm:text-sm opacity-70">Today's minutes</div>
                  <div className="text-xl sm:text-2xl font-bold">
                    {(task.timeSpent?.find((x) => x.date === dayjs().format("YYYY-MM-DD"))?.minutes) || 0}
                    <span className="text-xs sm:text-sm opacity-60"> / {task.timeGoalMinutes ?? "-" } min</span>
                  </div>
                  <div className="mt-2 text-xs sm:text-sm opacity-70">Streak: {
                    (() => {
                      const goal = task.timeGoalMinutes || 0;
                      const arr = habitProgressLast7(task);
                      let s = 0;
                      for (let i = arr.length - 1; i >= 0; i--) {
                        if (arr[i].minutes >= goal) s++; else break;
                      }
                      return s;
                    })()
                  }</div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full md:w-auto">
                  <button onClick={() => openLogModal(task)} className="px-3 sm:px-4 py-2 rounded-md bg-gradient-to-r from-purple-500 to-pink-500 text-xs sm:text-sm whitespace-nowrap">Log minutes</button>
                  <button onClick={() => openPostponeModal(task)} className="px-3 sm:px-4 py-2 rounded-md bg-white/10 text-xs sm:text-sm whitespace-nowrap">Postpone</button>
                  {/* Only show 'Mark Missed' when NOT completed */}
                  {!task.completed && <button onClick={() => openMissedSheet(task)} className="px-3 py-2 rounded-md bg-red-600/30 text-xs sm:text-sm whitespace-nowrap">Mark Missed</button>}
                </div>
              </div>
            )}

            {/* non-habit */}
            {!task.isHabit && (
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <button onClick={() => openPostponeModal(task)} className="px-3 sm:px-4 py-2 rounded-md bg-white/10 text-xs sm:text-sm">Postpone</button>
                {!task.completed && <button onClick={() => openMissedSheet(task)} className="px-3 sm:px-4 py-2 rounded-md bg-red-600/30 text-xs sm:text-sm">Mark Missed</button>}
              </div>
            )}

            {/* history & missed reasons */}
            <div className="mt-4">
              <div className="text-sm opacity-80 font-medium">History</div>
              {renderHistorySection(task)}
            </div>
          </div>
        ))}
      </div>

      {/* Log modal */}
      {showLogModal && logTask && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center p-4 bg-black/40 z-50">
          <div className="w-full max-w-lg bg-black/85 p-4 sm:p-5 rounded-t-2xl sm:rounded-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base sm:text-lg font-semibold break-words pr-2">Log minutes — {logTask.title}</h3>
              <button onClick={() => setShowLogModal(false)} className="text-white/70 px-2 text-sm sm:text-base flex-shrink-0">Close</button>
            </div>
            <input 
              type="number" 
              value={logMinutes} 
              onChange={(e) => setLogMinutes(e.target.value)} 
              placeholder="Minutes" 
              className="p-2 sm:p-3 rounded-md w-full text-black mb-2 text-sm sm:text-base" 
              min="0"
            />
            <textarea value={logSummary} onChange={(e) => setLogSummary(e.target.value)} placeholder="Short summary" className="p-2 sm:p-3 rounded-md w-full text-black mb-3 text-sm sm:text-base min-h-[80px]" />
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button onClick={() => setShowLogModal(false)} className="px-4 py-2 rounded-md bg-white/10 text-sm sm:text-base">Cancel</button>
              <button onClick={saveLog} className="px-4 py-2 rounded-md bg-green-500 text-sm sm:text-base">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Missed Bottom Sheet */}
      {showMissedSheet && missedTask && (
        <div className="fixed inset-0 flex flex-col justify-end z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowMissedSheet(false)} />
          <div onClick={(e) => e.stopPropagation()} className="relative z-60 bg-black/90 p-4 sm:p-5 rounded-t-2xl border-t border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0 pr-2">
                <div className="text-xs sm:text-sm opacity-70">Mark Missed</div>
                <div className="font-semibold text-sm sm:text-base break-words">{missedTask.title}</div>
              </div>
              <button onClick={() => setShowMissedSheet(false)} className="px-2 sm:px-3 py-1 sm:py-2 bg-white/5 rounded-md text-xs sm:text-sm flex-shrink-0">Close</button>
            </div>

            <label className="text-xs sm:text-sm opacity-80 block mb-1">Date</label>
            <input type="date" value={missedDate} onChange={(e) => setMissedDate(e.target.value)} className="p-2 sm:p-3 rounded-md w-full text-black mb-3 text-sm sm:text-base" />

            <label className="text-xs sm:text-sm opacity-80 block mb-1">Reason</label>
            <textarea value={missedReason} onChange={(e) => setMissedReason(e.target.value)} placeholder="Why did you miss this?" className="p-2 sm:p-3 rounded-md w-full text-black mb-3 text-sm sm:text-base min-h-[100px]" />

            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <button onClick={() => setShowMissedSheet(false)} className="px-4 py-2 rounded-md bg-white/10 text-sm sm:text-base">Cancel</button>
              <button onClick={markMissed} className="px-4 py-2 rounded-md bg-red-500 text-sm sm:text-base">Mark Missed</button>
            </div>
          </div>
        </div>
      )}

      {/* Postpone modal */}
      {showPostponeModal && postponeTask && (
        <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 bg-black/40 z-50">
          <div className="bg-black/80 p-4 sm:p-6 rounded-xl w-full max-w-md">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 break-words">Postpone: {postponeTask.title}</h3>
            <label className="text-xs sm:text-sm opacity-80 block mb-1">New Date</label>
            <input type="date" value={postponeDate} onChange={(e) => setPostponeDate(e.target.value)} className="p-2 sm:p-3 rounded-md w-full text-black mb-4 text-sm sm:text-base" />
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <button onClick={() => setShowPostponeModal(false)} className="px-4 py-2 rounded-md bg-white/10 text-sm sm:text-base">Cancel</button>
              <button onClick={savePostpone} className="px-4 py-2 rounded-md bg-green-500 text-sm sm:text-base">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
