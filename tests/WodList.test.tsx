import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "./utils";
import { makeWod } from "./fixtures";
import WodList from "@/components/public/WodList";

describe("WodList", () => {
  it("renders the workout column preserving line breaks", () => {
    const wod = makeWod({
      id: 1,
      event_number: 1,
      name: "Fran",
      workout: "FOR TIME\n0:00 - 4:00\n1 RM Clean\nTIMECAP: 12 minutos",
      description: "Notas del evento",
    });
    renderWithProviders(<WodList phaseName="Qualifier" wods={[wod]} />);

    expect(screen.getByText("Fran")).toBeDefined();
    expect(screen.getByText(/FOR TIME/)).toBeDefined();
    expect(screen.getByText("Notas del evento")).toBeDefined();
  });

  it("hides inactive events", () => {
    const active = makeWod({ id: 1, event_number: 1, name: "Fran", is_active: true });
    const inactive = makeWod({ id: 2, event_number: 2, name: "WOD Oculto", is_active: false });
    renderWithProviders(<WodList phaseName="Qualifier" wods={[active, inactive]} />);

    expect(screen.getByText("Fran")).toBeDefined();
    expect(screen.queryByText("WOD Oculto")).toBeNull();
  });

  it("shows the empty state when there are no active events", () => {
    renderWithProviders(
      <WodList phaseName="Qualifier" wods={[makeWod({ is_active: false })]} />,
    );
    expect(screen.getByText("Sin workouts en Qualifier")).toBeDefined();
  });
});