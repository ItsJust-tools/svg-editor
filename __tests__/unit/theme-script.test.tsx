import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ThemeScript } from "@itsjust/core";

describe("ThemeScript", () => {
  it("renders an inline script element that sets data-theme and data-contrast", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");
    expect(script).not.toBeNull();
    const body = script!.innerHTML;
    expect(body).toContain("itsjust-theme");
    expect(body).toContain("data-theme");
    expect(body).toContain("prefers-color-scheme: dark");
    expect(body).toContain("itsjust-contrast");
    expect(body).toContain("prefers-contrast: more");
    expect(body).not.toContain("--accent");
  });

  it("appends tool theme CSS variable setup when toolTheme is provided", () => {
    const { container } = render(
      <ThemeScript
        toolTheme={{
          accent: "#ff0000",
          accentHover: "#00ff00",
          accentSubtle: "#0000ff",
        }}
      />,
    );
    const body = container.querySelector("script")!.innerHTML;
    expect(body).toContain('"accent":"#ff0000"');
    expect(body).toContain("--accent");
    expect(body).toContain("--accent-hover");
    expect(body).toContain("--accent-subtle");
  });
});
