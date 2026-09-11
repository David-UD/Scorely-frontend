import { describe, it, expect, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import RoleGuard from "@/guards/RoleGuard";
import { useAuthStore } from "@/store/authStore";

function TestApp({ initialEntries = ["/admin"] }: { initialEntries?: string[] }) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/admin"
          element={
            <RoleGuard>
              <div>Admin Content</div>
            </RoleGuard>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

afterEach(() => {
  useAuthStore.setState({
    accessToken: null,
    refreshToken: null,
    user: null,
  });
  localStorage.clear();
});

describe("RoleGuard", () => {
  it("redirects to login when there is no session", () => {
    render(<TestApp />);
    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
  });

  it("renders children when the user is authenticated", () => {
    useAuthStore.setState({
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
      user: { email: "admin@scorely.com", role: "admin" },
    });

    render(<TestApp />);
    expect(screen.getByText("Admin Content")).toBeInTheDocument();
  });
});