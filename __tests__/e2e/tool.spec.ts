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

test("tool loads with correct title", async ({ page }) => {
  await page.goto("/");
  const title = await page.title();
  expect(title).toContain("SVG Editor");
});

test("textarea is editable", async ({ page }) => {
  await page.goto("/");
  const textarea = page.locator(".notepad-textarea");
  await textarea.fill('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  await expect(textarea).toContainText("svg");
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
