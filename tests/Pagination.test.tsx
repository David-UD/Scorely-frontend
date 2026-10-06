import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Pagination from "@/components/common/Pagination";

describe("Pagination", () => {
  it("renders nothing when there is a single page", () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onChange={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("navigates with page buttons and previous/next", () => {
    const onChange = vi.fn();
    render(<Pagination page={2} totalPages={4} onChange={onChange} />);

    expect(screen.getByRole("button", { name: "Página 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    fireEvent.click(screen.getByRole("button", { name: "Página 3" }));
    expect(onChange).toHaveBeenLastCalledWith(3);

    fireEvent.click(screen.getByRole("button", { name: "Página anterior" }));
    expect(onChange).toHaveBeenLastCalledWith(1);

    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it("disables previous on the first page and next on the last page", () => {
    const { rerender } = render(
      <Pagination page={1} totalPages={3} onChange={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();

    rerender(<Pagination page={3} totalPages={3} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Página siguiente" })).toBeDisabled();
  });

  it("collapses long ranges with ellipsis", () => {
    render(<Pagination page={5} totalPages={20} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Página 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Página 20" })).toBeInTheDocument();
    expect(screen.getAllByText("…").length).toBeGreaterThan(0);
  });
});