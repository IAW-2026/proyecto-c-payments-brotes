"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";

// Íconos SVG inline — sin dependencia extra
function IconPayments() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function IconPayouts() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function IconDashboard() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  role: string | undefined;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();

  const navItems: NavItem[] = [
    ...(role === "buyer"
      ? [{ href: "/payments", label: "Mis pagos", icon: <IconPayments /> }]
      : []),
    ...(role === "seller"
      ? [
          {
            href: "/payouts",
            label: "Mis acreditaciones",
            icon: <IconPayouts />,
          },
        ]
      : []),
    ...(role === "admin"
      ? [
          {
            href: "/dashboard/stats",
            label: "Estadísticas",
            icon: <IconDashboard />,
          },
          {
            href: "/dashboard/search",
            label: "Búsqueda",
            icon: <IconPayments />,
          },
        ]
      : []),
    ...(role === "seller"
      ? [
          {
            href: "/payouts/stats",
            label: "Estadísticas",
            icon: <IconDashboard />,
          },
        ]
      : []),
  ];

  return (
    <aside
      style={{ width: collapsed ? "56px" : "256px" }}
      className="relative h-full bg-verde-profundo text-verde-brote flex flex-col shrink-0 transition-[width] duration-300 ease-in-out overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-verde-bosque text-white whitespace-nowrap overflow-hidden px-4 h-14 shrink-0">
        {!collapsed && (
          <span className="font-bold text-base">Payments App</span>
        )}
        <button
          onClick={toggle}
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          className={`flex items-center justify-center rounded-lg w-8 h-8 shrink-0
            text-verde-brote hover:text-white hover:bg-verde-bosque
            transition-colors duration-200
            ${collapsed ? "mx-auto" : "ml-auto"}`}
        >
          {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1 overflow-hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            aria-current={pathname === item.href ? "page" : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-verde-brote hover:bg-verde-bosque hover:text-white transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && (
              <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                {item.label}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
