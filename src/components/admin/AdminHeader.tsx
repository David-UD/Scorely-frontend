import { Link, useNavigate } from "react-router-dom";
import { useSidebar } from "./SidebarContext";
import { useAuthStore } from "@/store/authStore";
import { logout } from "@/api/auth";
import { CloseIcon, LogoutIcon, MenuIcon } from "./icons";

export default function AdminHeader() {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 flex w-full border-b border-gray-200 bg-white">
      <div className="flex grow flex-col items-center justify-between lg:flex-row lg:px-6">
        <div className="flex w-full items-center justify-between gap-2 border-b border-gray-200 px-3 py-3 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          <button
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50"
            onClick={handleToggle}
            aria-label="Alternar barra lateral"
          >
            {isMobileOpen ? (
              <CloseIcon className="size-6" />
            ) : (
              <MenuIcon className="size-5" />
            )}
          </button>

          <Link to="/" className="lg:hidden">
            <span className="text-lg font-bold text-gray-900">
              S<span className="text-brand-500">corely</span>
            </span>
          </Link>

          <div className="flex-1" />
        </div>

        <div className="flex w-full items-center justify-end gap-4 px-5 py-3 shadow-theme-md lg:px-0 lg:py-4 lg:shadow-none">
          <div className="hidden items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 md:flex">
            <span className="flex size-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold uppercase text-brand-600">
              {(user?.email ?? "A").charAt(0)}
            </span>
            <div className="leading-tight">
              <p className="text-sm font-medium text-gray-800">{user?.email}</p>
              <p className="text-theme-xs text-gray-500">
                {user?.is_superuser ? "Superusuario" : "Admin de competición"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
          >
            <LogoutIcon className="size-4" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
}