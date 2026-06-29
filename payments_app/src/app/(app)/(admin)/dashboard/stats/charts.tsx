"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
  approved: "#7ba05d",
  pending: "#a67c52",
  rejected: "#e07a5f",
  paid: "#4c6b3d",
  primary: "#7ba05d",
  secondary: "#4c6b3d",
  light: "#cde5c1",
};

const PAYOUT_COLORS: Record<string, string> = {
  accredited: "#388e3c",
  pending: "#f9a825",
};

interface DashboardChartsProps {
  dailyVolume: { date: string; total: number; count: number }[];
  paymentsByStatus: { status: string; count: number }[];
  payoutsByStatus: { status: string; count: number }[];
  approvalRate: number;
  topSellers: {
    seller_id: string;
    seller_email: string | null;
    total: number;
  }[];
}

const statusLabels: Record<string, string> = {
  approved: "Aprobados",
  pending: "Pendientes",
  rejected: "Rechazados",
  cancelled: "Cancelados",
  accredited: "Acreditados",
  paid: "Acreditados",
};

export function DashboardCharts({
  dailyVolume,
  paymentsByStatus,
  payoutsByStatus,
  approvalRate,
  topSellers,
}: DashboardChartsProps) {
  const paymentChartData = paymentsByStatus.map((s) => ({
    name: statusLabels[s.status] ?? s.status,
    value: s.count,
    color: CHART_COLORS[s.status as keyof typeof CHART_COLORS] ?? "#a67c52",
  }));

  const payoutChartData = payoutsByStatus.map((s) => ({
    name: statusLabels[s.status] ?? s.status,
    value: s.count,
    color: PAYOUT_COLORS[s.status] ?? "#a67c52",
  }));

  const topSellerData = topSellers.map((s) => ({
    name: s.seller_email ?? s.seller_id.slice(0, 8),
    total: s.total,
  }));

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-beige rounded-xl p-5">
          <h3 className="text-sm font-semibold text-verde-profundo uppercase tracking-wide mb-4">
            Volumen de pagos diario
          </h3>
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
        </div>

        <div className="bg-white border border-beige rounded-xl p-5">
          <h3 className="text-sm font-semibold text-verde-profundo uppercase tracking-wide mb-4">
            Pagos por estado
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={paymentChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                paddingAngle={3}
              >
                {paymentChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {paymentChartData.map((entry, i) => (
              <div key={`${i}-${entry.name}`} className="flex items-center gap-1.5 text-xs text-marron-tierra">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}: {entry.value}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-beige rounded-xl p-5">
          <h3 className="text-sm font-semibold text-verde-profundo uppercase tracking-wide mb-4">
            Acreditaciones por estado
          </h3>
          {payoutChartData.length === 0 ? (
            <p className="text-sm text-marron-tierra text-center py-12">
              Sin acreditaciones aún
            </p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={payoutChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={3}
                  >
                    {payoutChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {payoutChartData.map((entry, i) => (
                  <div key={`${i}-${entry.name}`} className="flex items-center gap-1.5 text-xs text-marron-tierra">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-beige rounded-xl p-5 flex flex-col items-center justify-center gap-2">
          <h3 className="text-sm font-semibold text-verde-profundo uppercase tracking-wide mb-2">
            Tasa de aprobación
          </h3>
          <span className="text-5xl font-bold text-verde-hoja">
            {approvalRate}%
          </span>
          <span className="text-xs text-marron-tierra">
            de pagos aprobados sobre el total
          </span>
        </div>

        <div className="bg-white border border-beige rounded-xl p-5">
          <h3 className="text-sm font-semibold text-verde-profundo uppercase tracking-wide mb-4">
            Top 5 vendedores por acreditaciones
          </h3>
          {topSellerData.length === 0 ? (
            <p className="text-sm text-marron-tierra text-center py-8">
              Sin datos de vendedores
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={topSellerData}
                layout="vertical"
                margin={{ left: 20, right: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e8e2d6"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#a67c52" }}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#a67c52" }}
                  width={100}
                  tickFormatter={(v: string) =>
                    v.length > 12 ? v.slice(0, 12) + "…" : v
                  }
                />
                <Tooltip
                  formatter={(value) =>
                    formatAmount(Number(value))
                  }
                />
                <Bar dataKey="total" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
