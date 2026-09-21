import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "./SidebarContext";
import { useAuthStore } from "@/store/authStore";
import {
  BuildingIcon,
  ChartIcon,
  ChevronDownIcon,
  DotsIcon,
  GridIcon,
  GroupIcon,
  ListIcon,
  PlugIcon,
  TrophyIcon,
  UsersIcon,
} from "./icons";

interface NavItem {
  name: string;
  icon: React.ReactNode;
  path: string;
  enabled: boolean;
  badge?: string;
}

export default function AdminSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const isSuperUser = Boolean(useAuthStore((s) => s.user?.is_superuser));

  const menuItems: NavItem[] = [
    {
      name: "Dashboard",
      icon: <GridIcon />,
      path: "/admin",
      enabled: true,
    },
    {
      name: isSuperUser ? "Competiciones" : "Mis competiciones",
      icon: <TrophyIcon />,
      path: "/admin/competitions",
      enabled: true,
    },
    ...(isSuperUser
      ? [
          {
            name: "Categorías",
            icon: <GroupIcon />,
            path: "/admin/categories",
            enabled: true,
          },
          {
            name: "Filiaciones",
            icon: <BuildingIcon />,
            path: "/admin/affiliations",
            enabled: true,
          },
        ]
      : []),
  ];

  const manageItems: NavItem[] = [
    { name: "Eventos", icon: <ListIcon />, path: "/admin/events", enabled: true },
    { name: "Categorías por competición", icon: <GroupIcon />, path: "/admin/competition-categories", enabled: true },
    { name: "Atletas", icon: <UsersIcon />, path: "/admin/athletes", enabled: true },
    { name: "Equipos", icon: <GroupIcon />, path: "/admin/teams", enabled: true },
  ];

  const otherItems: NavItem[] = [
    { name: "Resultados", icon: <ChartIcon />, path: "/admin/scores", enabled: false },
    { name: "Scoring", icon: <PlugIcon />, path: "/admin/scoring", enabled: false },
  ];

  const isActive = (path: string) =>
    location.pathname === path ||
    location.pathname.startsWith(`${path}/`);
  const expanded = isExpanded || isHovered || isMobileOpen;

  const renderItem = (item: NavItem) => {
    const active = item.enabled && isActive(item.path);

    if (!item.enabled) {
      return (
        <li key={item.name}>
          <span className="menu-item cursor-not-allowed text-gray-300">
            <span className="menu-item-icon-size menu-item-icon-inactive opacity-40">
              {item.icon}
            </span>
            {expanded && <span className="line-through">{item.name}</span>}
          </span>
        </li>
      );
    }

    return (
      <li key={item.name}>
        <Link
          to={item.path}
          className={`menu-item group ${
            active ? "menu-item-active" : "menu-item-inactive"
          }`}
        >
          <span
            className={`menu-item-icon-size ${
              active ? "menu-item-icon-active" : "menu-item-icon-inactive"
            }`}
          >
            {item.icon}
          </span>
          {expanded && <span>{item.name}</span>}
          {item.badge && expanded && (
            <span className="ml-auto rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium uppercase text-brand-600">
              {item.badge}
            </span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out ${
        isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex py-8 ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/" className="flex items-center gap-1 text-2xl font-bold">
          <span className="size-8 shrink-0 rounded-lg bg-brand-500 bg-center bg-[radial-gradient(circle_at_center,white_0,white_1.5px,transparent_2px)] bg-[length:6px_6px]" />
          {expanded && (
            <span className="text-gray-900">
              S<span className="text-brand-500">corely</span>
            </span>
          )}
        </Link>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 flex text-xs uppercase leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {expanded ? "Menú" : <DotsIcon className="size-6" />}
              </h2>
              <ul className="flex flex-col gap-1">{menuItems.map(renderItem)}</ul>
            </div>
            <div>
              <h2
                className={`mb-4 flex text-xs uppercase leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {expanded ? "Gestión" : <DotsIcon className="size-6" />}
              </h2>
              <ul className="flex flex-col gap-1">{manageItems.map(renderItem)}</ul>
            </div>
            <div>
              <h2
                className={`mb-4 flex text-xs uppercase leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {expanded ? (
                  "Próximamente"
                ) : (
                  <span title="Próximamente">
                    <DotsIcon className="size-6" />
                  </span>
                )}
              </h2>
              <ul className="flex flex-col gap-1">{otherItems.map(renderItem)}</ul>
            </div>
          </div>
        </nav>

        <div className="mb-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <ChevronDownIcon className={`size-5 text-gray-400 ${expanded ? "rotate-180" : ""}`} />
          {expanded && (
            <p className="text-xs text-gray-500">
              {isSuperUser ? (
                <>Acceso completo al panel como <span className="font-medium text-gray-700">superusuario</span></>
              ) : (
                <>Ves solo tus <span className="font-medium text-gray-700">competiciones asignadas</span></>
              )}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}