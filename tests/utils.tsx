import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import type { UseQueryResult } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

export function queryResult<T>(overrides: Partial<UseQueryResult<T>> = {}): UseQueryResult<T> {
  return {
    data: undefined,
    error: null,
    isPending: true,
    isLoading: true,
    isError: false,
    isSuccess: false,
    isFetching: false,
    isFetched: false,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as UseQueryResult<T>;
}

export function renderWithProviders(ui: ReactNode, route = "/") {
  const client = createTestQueryClient();
  const utils = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...utils, client };
}