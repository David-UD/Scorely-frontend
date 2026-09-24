import { describe, it, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { makeWod, makeEventResult } from "./fixtures";
import type { CombinedLeaderboard } from "@/types";
import { buildCombinedLeaderboards } from "@/utils/leaderboard";
import CombinedLeaderboardTable from "@/components/public/CombinedLeaderboardTable";

function combined(): CombinedLeaderboard[] {
  return buildCombinedLeaderboards([
    {
      competition_id: 1,
      stage: "final",
      category: { code: "rx", name: "RX" },
      entries: [
        {
          rank: 1,
          competitor_id: 10,
          display_name: "Ana López",
          final_score: "200",
          event_ranks: [1, 1],
          event_scores: [100, 100],
          event_results: [
            makeEventResult({ event_id: 1, event_number: 1, phase: "QUALIFIER", score: 100, event_rank: 1 }),
            makeEventResult({ event_id: 2, event_number: 2, phase: "FINAL", score: 100, event_rank: 1 }),
          ],
        },
        {
          rank: 2,
          competitor_id: 11,
          display_name: "Luis Pérez",
          final_score: "194",
          event_ranks: [2, 2],
          event_scores: [94, 100],
          event_results: [
            makeEventResult({ event_id: 1, event_number: 1, phase: "QUALIFIER", score: 94, event_rank: 2 }),
            makeEventResult({ event_id: 2, event_number: 2, phase: "FINAL", score: 100, event_rank: 2 }),
          ],
        },
        {
          rank: 3,
          competitor_id: 12,
          display_name: "Sofia Ruiz",
          final_score: "94",
          event_ranks: [3, null],
          event_scores: [null, null],
          event_results: [],
        },
      ],
    },
  ]);
}

function wods() {
  return {
    qualifierWods: [makeWod({ id: 1, event_number: 1, phase: "QUALIFIER" })],
    finalWods: [makeWod({ id: 2, event_number: 2, phase: "FINAL" })],
  };
}

function bodyRows(): Element[] {
  const table = screen.getByRole("table");
  return Array.from(table.querySelectorAll("tbody tr"));
}

function setup() {
  const [lb] = combined();
  return render(
    <CombinedLeaderboardTable title="RX" entries={lb.entries} {...wods()} />,
  );
}

describe("CombinedLeaderboardTable", () => {
  it("renders rows in default position order", () => {
    setup();
    const rows = bodyRows();
    expect(rows[0].textContent).toContain("Ana López");
    expect(rows[1].textContent).toContain("Luis Pérez");
    expect(rows[2].textContent).toContain("Sofia Ruiz");
  });

  it("sorts by athlete name ascending and alternating on header click", () => {
    setup();
    fireEvent.click(screen.getByRole("columnheader", { name: /atleta/i }));
    const rowsAsc = bodyRows();
    expect(rowsAsc[0].textContent).toContain("Ana López");
    expect(rowsAsc[2].textContent).toContain("Sofia Ruiz");

    fireEvent.click(screen.getByRole("columnheader", { name: /atleta/i }));
    const rowsDesc = bodyRows();
    expect(rowsDesc[0].textContent).toContain("Sofia Ruiz");
    expect(rowsDesc[2].textContent).toContain("Ana López");
  });

  it("puts entries without data last even in descending event sort", () => {
    setup();
    const score1Header = screen.getByRole("columnheader", { name: /score 1/i });
    fireEvent.click(score1Header);
    let rows = bodyRows();
    expect(rows[2].textContent).toContain("Sofia Ruiz");
    expect(rows[0].textContent).toContain("Luis Pérez");

    fireEvent.click(score1Header);
    rows = bodyRows();
    expect(rows[2].textContent).toContain("Sofia Ruiz");
    expect(rows[0].textContent).toContain("Ana López");
  });

  it("sorts by position and total without mutating rank", () => {
    setup();
    fireEvent.click(screen.getByRole("columnheader", { name: /pos/i }));
    const rowsPos = bodyRows();
    expect(rowsPos[0].textContent).toContain("Ana López");

    fireEvent.click(screen.getByRole("columnheader", { name: /total/i }));
    const rowsTotal = bodyRows();
    expect(rowsTotal[0].textContent).toContain("Luis Pérez");
    expect(rowsTotal[2].textContent).toContain("Sofia Ruiz");

    fireEvent.click(screen.getByRole("columnheader", { name: /total/i }));
    const rowsTotalDesc = bodyRows();
    expect(rowsTotalDesc[0].textContent).toContain("Ana López");
    expect(rowsTotalDesc[2].textContent).toContain("Sofia Ruiz");
  });

  it("renders em-dashes for entries without data in the event columns", () => {
    setup();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("keeps the header sticky with a z-index for horizontal scroll", () => {
    setup();
    const headers = Array.from(document.querySelectorAll("thead th"));
    const stickyRows = Array.from(document.querySelectorAll("thead tr"));
    expect(stickyRows.length).toBe(2);
    stickyRows.forEach((row) => expect(row.className).toContain("sticky"));
    expect(headers.length).toBeGreaterThan(0);
  });

  it("highlights the podium (top 3) rows and hovers on any row", () => {
    setup();
    const rows = bodyRows();
    expect(rows[0].className).toContain("bg-brand-25");
    expect(rows[1].className).toContain("bg-brand-25");
    expect(rows[2].className).toContain("bg-brand-25");
    expect(rows[0].className).toContain("hover:bg-gray-50");
  });
});