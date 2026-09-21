import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/common/ScrollToTop";
import PublicLayout from "@/layout/PublicLayout";
import AdminLayout from "@/layout/AdminLayout";
import RoleGuard from "@/guards/RoleGuard";
import HomeIndex from "@/pages/public/HomeIndex";
import CompetitionDetail from "@/pages/public/CompetitionDetail";
import LoginPage from "@/pages/auth/LoginPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import CompetitionsPage from "@/pages/admin/CompetitionsPage";
import CompetitionFormPage from "@/pages/admin/CompetitionFormPage";
import CategoriesPage from "@/pages/admin/CategoriesPage";
import CategoryFormPage from "@/pages/admin/CategoryFormPage";
import AffiliationsPage from "@/pages/admin/AffiliationsPage";
import AffiliationFormPage from "@/pages/admin/AffiliationFormPage";
import CompetitionCategoriesPage from "@/pages/admin/CompetitionCategoriesPage";
import EventsPage from "@/pages/admin/EventsPage";
import EventFormPage from "@/pages/admin/EventFormPage";
import AthletesPage from "@/pages/admin/AthletesPage";
import AthleteFormPage from "@/pages/admin/AthleteFormPage";
import TeamsPage from "@/pages/admin/TeamsPage";
import TeamFormPage from "@/pages/admin/TeamFormPage";
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
          <Route path="/admin/competitions" element={<CompetitionsPage />} />
          <Route path="/admin/competitions/new" element={<CompetitionFormPage />} />
          <Route path="/admin/competitions/:id/edit" element={<CompetitionFormPage />} />
          <Route path="/admin/categories" element={<CategoriesPage />} />
          <Route path="/admin/categories/new" element={<CategoryFormPage />} />
          <Route path="/admin/categories/:id/edit" element={<CategoryFormPage />} />
          <Route path="/admin/competition-categories" element={<CompetitionCategoriesPage />} />
          <Route path="/admin/affiliations" element={<AffiliationsPage />} />
          <Route path="/admin/affiliations/new" element={<AffiliationFormPage />} />
          <Route path="/admin/affiliations/:id/edit" element={<AffiliationFormPage />} />
          <Route path="/admin/events" element={<EventsPage />} />
          <Route path="/admin/events/new" element={<EventFormPage />} />
          <Route path="/admin/events/:id/edit" element={<EventFormPage />} />
          <Route path="/admin/athletes" element={<AthletesPage />} />
          <Route path="/admin/athletes/new" element={<AthleteFormPage />} />
          <Route path="/admin/athletes/:id/edit" element={<AthleteFormPage />} />
          <Route path="/admin/teams" element={<TeamsPage />} />
          <Route path="/admin/teams/new" element={<TeamFormPage />} />
          <Route path="/admin/teams/:id/edit" element={<TeamFormPage />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}