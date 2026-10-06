import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AthletePanel from "@/components/public/AthletePanel";
import { useAthleteProfile } from "@/hooks/useAthleteProfile";
import type { CombinedLeaderboardEntry, EventResult } from "@/types";

vi.mock("@/hooks/useAthleteProfile", () => ({
  useAthleteProfile: vi.fn(),
}));

const mockedUseAthleteProfile = vi.mocked(useAthleteProfile);

function makeResult(overrides: Partial<EventResult> = {}): EventResult {
  return {
    event_id: 1,
    event_number: 1,
    event_name: "Fran",
    phase: "QUALIFIER",
    result: "03:00",
    event_rank: 1,
    score: 100,
    ...overrides,
  };
}

function entry(overrides: Partial<CombinedLeaderboardEntry> = {}): CombinedLeaderboardEntry {
  return {
    rank: 1,
    competitor_id: 10,
    display_name: "Ana López",
    event_results: [],
    total_score: 200,
    qualified: true,
    ...overrides,
  };
}

function mockProfile(data: { photoUrl: string | null; box: string | null } | undefined) {
  mockedUseAthleteProfile.mockReturnValue({
    data,
    isLoading: false,
  } as unknown as ReturnType<typeof useAthleteProfile>);
}

describe("AthletePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfile({ photoUrl: null, box: null });
  });

  it("shows the photo, home box, general position and event ranks", () => {
    mockProfile({ photoUrl: "https://cdn.test/ana.jpg", box: "Box El Pilar" });
    render(
      <AthletePanel
        entry={entry({
          rank: 3,
          event_results: [
            makeResult({ event_id: 2, event_number: 2, event_name: "Clean", event_rank: 5 }),
            makeResult({ event_id: 1, event_number: 1, event_name: "Fran", event_rank: 1 }),
          ],
        })}
        participantId={10}
        onClose={() => {}}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Ana López" })).toBeInTheDocument();
    expect(screen.getByAltText("Ana López")).toHaveAttribute(
      "src",
      "https://cdn.test/ana.jpg",
    );
    expect(screen.getByText("Ana López")).toBeInTheDocument();
    expect(screen.getByText("Box El Pilar")).toBeInTheDocument();
    expect(screen.getByText("Posición general")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Eventos")).toBeInTheDocument();

    const names = screen.getAllByText(/^(Fran|Clean)$/).map((el) => el.textContent);
    expect(names).toEqual(["Fran", "Clean"]);
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#5")).toBeInTheDocument();
  });

  it("shows initials, name and no box when there is no profile", () => {
    render(<AthletePanel entry={entry()} participantId={10} onClose={() => {}} />);

    expect(screen.getByText("AL")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("Ana López")).toBeInTheDocument();
    expect(screen.queryByText("Box El Pilar")).toBeNull();
    expect(screen.getByText("Sin eventos registrados.")).toBeInTheDocument();
  });

  it("falls back to an event label and a dash when data is missing", () => {
    render(
      <AthletePanel
        entry={entry({
          event_results: [makeResult({ event_name: "", event_number: 4, event_rank: null })],
        })}
        participantId={10}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText("Evento 4")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("requests a team profile when the participant is a team", () => {
    render(
      <AthletePanel
        entry={entry({ competitor_id: 20, display_name: "Equipo Alfa" })}
        participantId={5}
        participantType="team"
        onClose={() => {}}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Equipo Alfa" })).toBeInTheDocument();
    expect(mockedUseAthleteProfile).toHaveBeenCalledWith(5, "team");
    expect(screen.getByText("EA")).toBeInTheDocument();
  });

  it("closes on the close button, the backdrop and Escape", () => {
    const onClose = vi.fn();
    render(<AthletePanel entry={entry()} participantId={10} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    fireEvent.click(screen.getByRole("button", { name: "Cerrar panel del atleta" }));
    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(3);
  });
});