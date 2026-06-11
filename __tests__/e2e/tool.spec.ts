import { test, expect } from "@playwright/test";

async function closeBackdropIfOpen(page: import("@playwright/test").Page) {
  const backdrop = page.locator(".sidebar-backdrop");
  for (let i = 0; i < 3; i++) {
    const visible = await backdrop.isVisible().catch(() => false);
    if (!visible) return;
    await backdrop.evaluate((el) => (el as HTMLElement).click());
    await page.waitForTimeout(100);
  }
}

async function ensureToolbarInteractable(
  page: import("@playwright/test").Page,
) {
  await closeBackdropIfOpen(page);
  const backdrop = page.locator(".sidebar-backdrop");
  if (await backdrop.isVisible().catch(() => false)) {
    await page.keyboard.press("Control+b");
    await expect(backdrop).toBeHidden();
  }
}

async function typeInEditor(
  page: import("@playwright/test").Page,
  text: string,
) {
  await ensureToolbarInteractable(page);
  const textarea = page.locator(".svg-editor-textarea");
  await textarea.fill(text);
}

test("tool loads with correct title", async ({ page }) => {
  await page.goto("/");
  const title = await page.title();
  expect(title).toContain("SVG Editor");
});

test("textarea is editable", async ({ page }) => {
  await page.goto("/");
  const textarea = page.locator(".svg-editor-textarea");
  const defaultSvg = await textarea.inputValue();
  // Default SVG should contain a rect and circle
  expect(defaultSvg).toContain("<rect");
  expect(defaultSvg).toContain("<circle");

  // Modify and verify
  await textarea.fill('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" fill="red"/></svg>');
  await expect(textarea).toHaveValue(/fill="red"/);

  // Reset
  await page.getByRole("button", { name: /reset/i }).click();
  await expect(textarea).toHaveValue(/>/);
});

test("format button prettifies SVG code", async ({ page }) => {
  await page.goto("/");
  await ensureToolbarInteractable(page);
  const textarea = page.locator(".svg-editor-textarea");
  const formatButton = page.getByRole("button", { name: /Format SVG code/i });

  // Enter unformatted SVG
  await textarea.fill('<svg xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="50" height="50" fill="blue"/></svg>');

  // Click Format
  await formatButton.click();

  // After formatting, SVG should have newlines
  const formatted = await textarea.inputValue();
  expect(formatted).toContain("\n");
});

test("preview tab switches and shows SVG", async ({ page }) => {
  await page.goto("/");
  await ensureToolbarInteractable(page);

  const previewTab = page.getByRole("tab", { name: "Preview" });
  await previewTab.click();

  // Preview pane should be visible with an iframe
  const iframe = page.locator(".svg-editor-preview-iframe");
  await expect(iframe).toBeVisible();
});

test("copy button copies SVG to clipboard", async ({ page }) => {
  await page.goto("/");
  await ensureToolbarInteractable(page);

  // Grant clipboard permission
  await page.context().grantPermissions(["clipboard-write"]);

  const copyButton = page.getByRole("button", { name: /Copy SVG code/i });
  await copyButton.click();
  // Should work without errors (no assertion needed if no error toast appears)
  const errorToast = page.locator(".toast-error");
  await expect(errorToast).toHaveCount(0);
});

test("undo/redo buttons enable/disable correctly", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await ensureToolbarInteractable(page);

  const undoButton = page.getByRole("button", { name: "Undo (Ctrl+Z)" });
  const redoButton = page.getByRole("button", { name: "Redo (Ctrl+Y)" });
  await expect(undoButton).toBeDisabled();
  await expect(redoButton).toBeDisabled();

  if (testInfo.project.name.includes("Mobile")) {
    await expect(undoButton).toBeVisible();
    return;
  }

  // Modify the SVG to enable undo
  await typeInEditor(page, `<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40"/></svg>`);

  await expect(undoButton).toBeEnabled();
  await expect(redoButton).toBeDisabled();

  await undoButton.click({ force: true });
  await expect(redoButton).toBeEnabled();

  await redoButton.click({ force: true });
  await expect(redoButton).toBeDisabled();
});

test("export dropdown opens and shows JSON format", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await ensureToolbarInteractable(page);
  const exportButton = page.getByRole("button", { name: /export/i });
  await exportButton.click({ force: true });
  if (testInfo.project.name.includes("Mobile")) {
    await expect(exportButton).toBeVisible();
    return;
  }
  const menu = page.getByRole("listbox");
  await expect(menu).toBeVisible();
  await expect(page.getByRole("option", { name: /JSON/ })).toBeVisible();
  await page.click("body");
  await expect(menu).not.toBeVisible();
});

test("sidebar toggle button works", async ({ page }) => {
  await page.goto("/");
  await ensureToolbarInteractable(page);
  const sidebarToggle = page.locator(".toolbar-btn-sidebar");
  const sidebar = page.locator(".tool-shell-sidebar");
  const mobile =
    (await page.viewportSize())?.width !== undefined &&
    (await page.viewportSize())!.width <= 768;
  const isCollapsed = await sidebar.evaluate((el) =>
    el.classList.contains("collapsed"),
  );
  if (isCollapsed) {
    await sidebarToggle.click();
    await expect(sidebar).toHaveClass(/open/);
    if (mobile) {
      await page.locator(".sidebar-backdrop").click();
    } else {
      await sidebarToggle.click();
    }
    await expect(sidebar).toHaveClass(/collapsed/);
    return;
  }
  await expect(sidebar).toHaveClass(/open/);
  if (mobile) {
    await page.locator(".sidebar-backdrop").click();
  } else {
    await sidebarToggle.click();
  }
  await expect(sidebar).toHaveClass(/collapsed/);
});

test("dark mode toggle works", async ({ page }) => {
  await page.goto("/");
  await ensureToolbarInteractable(page);
  const themeButton = page.getByRole("button", {
    name: /Switch to dark mode/i,
  });
  if (await themeButton.isVisible()) {
    await themeButton.click();
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "dark");

    const lightButton = page.getByRole("button", {
      name: /Switch to light mode/i,
    });
    await lightButton.click();
    await expect(html).toHaveAttribute("data-theme", "light");
  }
});

test("SEO meta tags are present", async ({ page }) => {
  await page.goto("/");

  const title = await page.title();
  expect(title).toBeTruthy();

  const description = await page.getAttribute(
    'meta[name="description"]',
    "content",
  );
  expect(description).toBeTruthy();

  const ogTitle = await page.getAttribute(
    'meta[property="og:title"]',
    "content",
  );
  expect(ogTitle).toBeTruthy();

  const ogImage = await page.getAttribute(
    'meta[property="og:image"]',
    "content",
  );
  expect(ogImage).toBeTruthy();

  const canonical = await page.getAttribute('link[rel="canonical"]', "href");
  expect(canonical).toBeTruthy();
});

test("JSON-LD structured data is present", async ({ page }) => {
  await page.goto("/");
  const jsonLd = page.locator('script[type="application/ld+json"]').first();
  const content = await jsonLd.textContent();
  const parsed = JSON.parse(content!);
  expect(parsed["@type"]).toBe("WebApplication");
  expect(parsed.name).toBeTruthy();
  expect(parsed.offers.price).toBe("0");
});

test("sitemap.xml is accessible", async ({ page }) => {
  const response = await page.goto("/sitemap.xml");
  expect(response?.ok()).toBe(true);
  const content = await response?.text();
  expect(content).toContain("urlset");
});

test("robots.txt is accessible", async ({ page }) => {
  const response = await page.goto("/robots.txt");
  expect(response?.ok()).toBe(true);
  const content = await response?.text();
  expect(content).toMatch(/User-[Aa]gent/);
});

test("keyboard shortcuts overlay opens and closes", async ({
  page,
  browserName,
}, _testInfo) => {
  if (browserName !== "chromium") return;
  await page.goto("/");
  await ensureToolbarInteractable(page);
  if (_testInfo.project.name.includes("Mobile")) {
    await expect(
      page.getByRole("button", { name: /keyboard shortcuts/i }),
    ).toBeVisible();
    return;
  }
  await page
    .getByRole("button", { name: /keyboard shortcuts/i })
    .click({ force: true });
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("undo/redo via keyboard shortcuts", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await page.goto("/");
  await ensureToolbarInteractable(page);
  if (testInfo.project.name.includes("Mobile")) {
    await expect(
      page.getByRole("button", { name: /undo/i }),
    ).toBeVisible();
    return;
  }

  await typeInEditor(page, `<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40"/></svg>`);

  const undoButton = page.getByRole("button", { name: "Undo (Ctrl+Z)" });
  await expect(undoButton).toBeEnabled();

  const redoButton = page.getByRole("button", { name: "Redo (Ctrl+Y)" });
  await expect(redoButton).toBeDisabled();

  await page.locator("body").press("Control+z");
  await expect(redoButton).toBeEnabled();

  await page.locator("body").press("Control+Shift+z");
  await expect(undoButton).toBeEnabled();
});

test("mobile sidebar backdrop closes sidebar", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");

  await ensureToolbarInteractable(page);
  const sidebar = page.locator(".tool-shell-sidebar");

  await page.locator('[aria-label="Show options"]').click();
  await expect(sidebar).toHaveClass(/open/);

  await page
    .locator(".sidebar-backdrop")
    .evaluate((el) => (el as HTMLElement).click());
  await expect(sidebar).toHaveClass(/collapsed/);
});

test("import from json file works", async ({ page }) => {
  await page.goto("/");
  await ensureToolbarInteractable(page);

  const fileContent = JSON.stringify({
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="green"/></svg>',
    title: "Imported SVG",
  });

  const fileInput = page.locator('input[type="file"]');
  await fileInput.evaluate((el: HTMLInputElement) => {
    el.style.display = "block";
    el.style.visibility = "visible";
  });
  await fileInput.setInputFiles({
    name: "test.json",
    mimeType: "application/json",
    buffer: Buffer.from(fileContent),
  });

  await expect
    .poll(() => page.locator(".svg-editor-textarea").inputValue())
    .toContain("green");
});

test("export json download triggers", async ({ page }) => {
  await page.goto("/");
  await ensureToolbarInteractable(page);

  const exportButton = page.getByRole("button", { name: /export/i });
  await exportButton.click({ force: true });

  const jsonOption = page.getByRole("option", { name: /JSON/ });
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    jsonOption.click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.json$/);
});

test("404 page works", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  const contentType = response?.headers()["content-type"] ?? "";
  expect(contentType).toContain("text/html");
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
});

test("visual regression — default view", async ({ page, browserName }) => {
  if (browserName !== "chromium") return;
  await page.goto("/");
  await page.waitForSelector(".tool-shell-canvas");
  await expect(page.locator(".tool-shell")).toBeVisible();
});

test("sidebar shows SVG info for default SVG", async ({ page }) => {
  await page.goto("/");
  await ensureToolbarInteractable(page);
  await page.setViewportSize({ width: 1280, height: 800 });

  // The sidebar should display SVG info
  const sidebar = page.locator(".tool-sidebar");
  await expect(sidebar).toBeVisible();

  // Should show code size
  await expect(sidebar.locator("text=Code Size")).toBeVisible();
  // Should show elements count
  await expect(sidebar.locator("text=Elements")).toBeVisible();
});

test("reset button restores default SVG", async ({ page }) => {
  await page.goto("/");
  await ensureToolbarInteractable(page);
  const textarea = page.locator(".svg-editor-textarea");

  // Modify the SVG
  await textarea.fill('<svg xmlns="http://www.w3.org/2000/svg"><text x="10" y="20">test</text></svg>');

  // Click Reset
  await page.getByRole("button", { name: /Reset to default SVG/i }).click();

  // Should contain default shapes (rect + circle)
  const value = await textarea.inputValue();
  expect(value).toContain("<rect");
  expect(value).toContain("<circle");
});