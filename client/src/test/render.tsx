import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { OopsProvider } from "@/components/OopsProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

/** Renders a component with the same providers as the real app. */
export function renderApp(ui: ReactElement, route = "/") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        <OopsProvider>{ui}</OopsProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}
