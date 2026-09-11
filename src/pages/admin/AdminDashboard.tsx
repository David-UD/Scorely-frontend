import EmptyState from "@/components/common/EmptyState";

export default function AdminDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-title-sm font-semibold text-gray-900">Panel de administración</h1>
      <EmptyState
        title="Módulo en construcción"
        description="El CRUD de competiciones, categorías, etapas, eventos, participantes y resultados se implementará en una iteración posterior."
      />
    </div>
  );
}