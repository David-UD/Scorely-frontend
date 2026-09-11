import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/common/ScrollToTop";
import PublicLayout from "@/layout/PublicLayout";
import AdminLayout from "@/layout/AdminLayout";
import RoleGuard from "@/guards/RoleGuard";
import HomeIndex from "@/pages/public/HomeIndex";
import CompetitionDetail from "@/pages/public/CompetitionDetail";
import LoginPage from "@/pages/auth/LoginPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index path="/" element={<HomeIndex />} />
          <Route path="/competitions/:slug/" element={<CompetitionDetail />} />
        </Route>

        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <RoleGuard>
              <AdminLayout />
            </RoleGuard>
          }
        >
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}