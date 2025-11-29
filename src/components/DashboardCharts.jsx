import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";
import React from "react";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend
);

function chartOptions(bg=false) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const fontSize = isMobile ? 10 : 12;
  return {
    plugins: {
      legend: {
        display: true, 
        labels: {
          color: '#fff', 
          font: {size: fontSize}
        }
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    backgroundColor: bg ?  "rgba(0,0,0,0.1)" : "transparent",
    scales: {
      x: { 
        grid: { color: 'rgba(255,255,255,0.12)' }, 
        ticks:{color:'#fff', font: {size: fontSize}}
      },
      y: { 
        grid: { color: 'rgba(255,255,255,0.14)' }, 
        ticks:{color:'#fff', font: {size: fontSize}}
      }
    }
  };
}

export default function DashboardCharts({ weeklyExpenseData, categoryData, habitMinutesData, healthWeekData }) {
  return (
    <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 md:grid-cols-2">
      <div className="bg-black/25 rounded-xl p-3 sm:p-4 min-w-0 overflow-hidden" style={{height:'280px', minHeight:'280px'}}>
        <div className="font-medium mb-2 gradient-text text-sm sm:text-base">Last 7 Days Expenses</div>
        <Line
          data={{
            labels: weeklyExpenseData.labels,
            datasets: [{
              label: "Expense (₹)",
              data: weeklyExpenseData.data,
              borderColor: "#4f46e5",
              backgroundColor: "rgba(99,102,241,0.08)",
              fill: true,
              tension:0.38
            }]
          }}
          options={chartOptions()}
        />
      </div>
      <div className="bg-black/25 rounded-xl p-3 sm:p-4 min-w-0 overflow-hidden" style={{height:'280px', minHeight:'280px'}}>
        <div className="font-medium mb-2 gradient-text text-sm sm:text-base">Category Breakdown</div>
        <Pie
          data={{
            labels: categoryData.labels,
            datasets: [{
              data: categoryData.data,
              backgroundColor: [
                  '#60a5fa','#4ade80','#f472b6','#facc15','#fb923c','#a78bfa', '#e879f9', '#38bdf8'
              ],
              borderWidth:2,
              borderColor: 'rgba(24,24,30,0.5)'
            }],
          }}
          options={{plugins:{legend:{labels:{color:'#fff', font:{size:10}}}},maintainAspectRatio:false, responsive: true}}
        />
      </div>
      <div className="bg-black/25 rounded-xl p-3 sm:p-4 min-w-0 overflow-hidden" style={{height:'280px', minHeight:'280px'}}>
        <div className="font-medium mb-2 gradient-text text-sm sm:text-base">Habit Minutes (last 7 days)</div>
        <Bar
          data={{
            labels: habitMinutesData.labels,
            datasets: [{
              label: "Habit Minutes",
              data: habitMinutesData.data,
              backgroundColor: "#a78bfa",
              borderColor: "#8b5cf6"
            }]
          }}
          options={chartOptions()}
        />
      </div>
      {healthWeekData && healthWeekData.labels && (
        <div className="bg-black/25 rounded-xl p-3 sm:p-4 min-w-0 overflow-hidden" style={{height:'280px', minHeight:'280px'}}>
          <div className="font-medium mb-2 gradient-text text-sm sm:text-base">Health This Week</div>
          <Bar
            data={{
              labels: healthWeekData.labels,
              datasets: [
                {
                  label: "Water (cups)",
                  data: healthWeekData.water,
                  backgroundColor: "#60a5fa",
                  borderColor: "#60a5fa"
                },
                {
                  label: "Sleep (hrs)",
                  data: healthWeekData.sleep,
                  backgroundColor: "#f472b6",
                  borderColor: "#f472b6"
                },
                {
                  label: "Steps",
                  data: healthWeekData.steps,
                  backgroundColor: "#4ade80",
                  borderColor: "#4ade80"
                }
              ]
            }}
            options={chartOptions()}
          />
        </div>
      )}
    </div>
  );
}
