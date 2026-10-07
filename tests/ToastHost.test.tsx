import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ToastHost from "@/components/common/ToastHost";
import { showToast, useToastStore } from "@/store/toastStore";

describe("ToastHost", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it("renders nothing when there are no toasts", () => {
    const { container } = render(<ToastHost />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the messages stored in the store", () => {
    useToastStore.setState({
      toasts: [
        { id: 1, message: "Atleta creado." },
        { id: 2, message: "Equipo creado." },
      ],
    });
    render(<ToastHost />);
    expect(screen.getByText("Atleta creado.")).toBeInTheDocument();
    expect(screen.getByText("Equipo creado.")).toBeInTheDocument();
  });

  it("dismisses a toast when its close button is clicked", () => {
    showToast("Cerrar");
    render(<ToastHost />);
    fireEvent.click(screen.getByLabelText("Cerrar notificación"));
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});