import type { ReactNode } from "react";

interface ChartMockProps {
  data?: unknown;
  children?: ReactNode;
  [key: string]: unknown;
}

function ResponsiveContainer({ children }: ChartMockProps) {
  return <div data-testid="recharts-responsive-container">{children}</div>;
}

function BarChart({ data, children }: ChartMockProps) {
  return (
    <div data-testid="recharts-bar-chart" data-chart-data={JSON.stringify(data ?? null)}>
      {children}
    </div>
  );
}

function PieChart({ children }: ChartMockProps) {
  return <div data-testid="recharts-pie-chart">{children}</div>;
}

function LineChart({ data, children }: ChartMockProps) {
  return (
    <div data-testid="recharts-line-chart" data-chart-data={JSON.stringify(data ?? null)}>
      {children}
    </div>
  );
}

function Bar() {
  return null;
}

function Pie({ data }: ChartMockProps) {
  return (
    <div data-testid="recharts-pie" data-chart-data={JSON.stringify(data ?? null)} />
  );
}

function Line() {
  return null;
}

function Cell() {
  return null;
}

function CartesianGrid() {
  return null;
}

function XAxis() {
  return null;
}

function YAxis() {
  return null;
}

function Tooltip() {
  return null;
}

function Legend() {
  return null;
}

export {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
};
