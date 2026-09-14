import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AdminScopeState {
  competitionId: number | null;
  setCompetitionId: (id: number | null) => void;
}

export const useAdminScopeStore = create<AdminScopeState>()(
  persist(
    (set) => ({
      competitionId: null,
      setCompetitionId: (competitionId) => set({ competitionId }),
    }),
    {
      name: "scorely-admin-scope",
      partialize: (state) => ({ competitionId: state.competitionId }),
    },
  ),
);