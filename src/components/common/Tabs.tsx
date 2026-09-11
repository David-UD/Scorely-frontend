import { cn } from "@/utils/cn";

export interface TabItem {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  ariaLabel?: string;
}

export default function Tabs({
  tabs,
  activeKey,
  onChange,
  ariaLabel,
}: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex gap-1 rounded-lg bg-gray-100 p-1"
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={activeKey === tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            "rounded-md px-5 py-2 text-sm font-medium transition",
            activeKey === tab.key
              ? "bg-white text-gray-900 shadow-theme-sm"
              : "text-gray-500 hover:text-gray-700",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}