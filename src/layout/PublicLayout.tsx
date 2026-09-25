import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/utils/cn";

function HeaderLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "rounded-lg px-3 py-2 text-sm font-medium transition",
          isActive ? "text-brand-600 bg-brand-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
        )
      }
    >
      {children}
    </NavLink>
  );
}

export default function PublicLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-lg font-bold text-gray-900">
            <span className="text-brand-500">S</span>corely
          </Link>

          <nav className="flex items-center gap-1">
            <HeaderLink to="/">Inicio</HeaderLink>
            <Link
              to={isAuthenticated ? "/admin" : "/login"}
              className="ml-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
            >
              {isAuthenticated ? "Admin" : "Acceder"}
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-gray-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-400 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Scorely. Resultados públicos de competiciones deportivas.
        </div>
      </footer>
    </div>
  );
}