"use client";

import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatAmount } from "@/lib/format";

const CHART_COLORS = {
  paid: "#4c6b3d",
  pending: "#a67c52",
  primary: "#4c6b3d",
};

const statusLabels: Record<string, string> = {
  paid: "Acreditados",
  pending: "Pendientes",
};

interface PayoutStatsChartsProps {
  dailyVolume: { date: string; total: number; count: number }[];
  statusDistribution: { status: string; count: number }[];
}

export function PayoutStatsCharts({
  dailyVolume,
  statusDistribution,
}: PayoutStatsChartsProps) {
  const pieData = statusDistribution.map((s) => ({
    name: statusLabels[s.status] ?? s.status,
    value: s.count,
    color: CHART_COLORS[s.status as keyof typeof CHART_COLORS] ?? "#a67c52",
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white border border-beige rounded-xl p-5">
        <h3 className="text-sm font-semibold text-verde-profundo uppercase tracking-wide mb-4">
          Acreditaciones en el tiempo
        </h3>
        {dailyVolume.length === 0 ? (
          <p className="text-sm text-marron-tierra text-center py-12">
            Sin acreditaciones registradas
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dailyVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e2d6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#a67c52" }}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#a67c52" }}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value) =>
                  formatAmount(Number(value))
                }
                labelFormatter={(label) => `Fecha: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                dot={{ r: 3, fill: CHART_COLORS.primary }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white border border-beige rounded-xl p-5">
        <h3 className="text-sm font-semibold text-verde-profundo uppercase tracking-wide mb-4">
          Distribución por estado
        </h3>
        {pieData.length === 0 ? (
          <p className="text-sm text-marron-tierra text-center py-12">
            Sin acreditaciones registradas
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {pieData.map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center gap-1.5 text-xs text-marron-tierra"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.name}: {entry.value}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
