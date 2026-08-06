import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { sectorSummary, breakfastMenuChart, noonSnackChart, nutritionMenuChart } from "../components/data/mockData.js";

const palette = ["#0F6E5D", "#1C8A75", "#37A38C", "#5CBBA5", "#F2A93B", "#E2574C"];

function ChartCard({ title, children, height = 240 }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <h3 className="mb-4 font-display text-sm font-bold text-ink">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #E4DFCF",
  fontSize: 12,
  fontFamily: "Inter, sans-serif",
};

export default function Charts() {
  const openClosedData = [
    { name: "ખુલ્લા", value: sectorSummary.reduce((s, r) => s + r.open, 0) },
    { name: "બંધ", value: sectorSummary.reduce((s, r) => s + r.closed, 0) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-[13px] font-bold uppercase tracking-[0.2em] text-primary">
          Insights
        </p>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">Worker Details · Quick Charts</h1>
        <p className="mt-1 text-sm text-muted">
          A district-wide read of centre status, meals served, and menu variety.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="સેજા મુજબ કુલ કેન્દ્રો (Total Centres by Sector)">
          <BarChart data={sectorSummary} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDE8D8" vertical={false} />
            <XAxis dataKey="sector" tick={{ fontSize: 10, fill: "#5C6C70" }} interval={0} angle={-30} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11, fill: "#5C6C70" }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#0F6E5D" />
          </BarChart>
        </ChartCard>

        <ChartCard title="આંગણવાડી કેન્દ્ર ખુલ્લું છે? (Open vs Closed)">
          <BarChart data={openClosedData} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDE8D8" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#5C6C70" }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#16262A" }} width={60} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={36}>
              {openClosedData.map((_, i) => (
                <Cell key={i} fill={i === 0 ? "#0F6E5D" : "#E2574C"} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title="સવારના નાસ્તાનું મેનુ (Breakfast Menu)">
          <BarChart data={breakfastMenuChart} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDE8D8" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#5C6C70" }} interval={0} angle={-25} textAnchor="end" height={70} />
            <YAxis tick={{ fontSize: 11, fill: "#5C6C70" }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {breakfastMenuChart.map((_, i) => (
                <Cell key={i} fill={palette[i % palette.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title="બપોરના નાસ્તાનું મેનુ (Noon Snack Menu)">
          <BarChart data={noonSnackChart} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDE8D8" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#5C6C70" }} interval={0} angle={-25} textAnchor="end" height={80} />
            <YAxis tick={{ fontSize: 11, fill: "#5C6C70" }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {noonSnackChart.map((_, i) => (
                <Cell key={i} fill={palette[(i + 2) % palette.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title="પોષણ સુધા મેનુ (Nutrition Menu)" height={260}>
          <BarChart data={nutritionMenuChart} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDE8D8" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#5C6C70" }} interval={0} angle={-25} textAnchor="end" height={80} />
            <YAxis tick={{ fontSize: 11, fill: "#5C6C70" }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#F2A93B" />
          </BarChart>
        </ChartCard>

        <ChartCard title="સેજા મુજબ નાસ્તો મેળવનાર બાળકો (Children Fed by Sector)">
          <BarChart data={sectorSummary} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDE8D8" vertical={false} />
            <XAxis dataKey="sector" tick={{ fontSize: 10, fill: "#5C6C70" }} interval={0} angle={-30} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11, fill: "#5C6C70" }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="fed" radius={[6, 6, 0, 0]} fill="#E2574C" />
          </BarChart>
        </ChartCard>
      </div>
    </div>
  );
}
