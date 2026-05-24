import { expect, test } from "@playwright/test";

async function logIn(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Username").fill("user");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page.getByText("Kanban Board")).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await logIn(page);
});

test("loads the kanban board", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Kanban Studio" })).toBeVisible();
  await expect(page.locator('[data-testid^="column-"]')).toHaveCount(5);
});

test("adds a card to a column", async ({ page }) => {
  await page.goto("/");
  const cardTitle = `E2E-card-${Date.now()}`;
  const firstColumn = page.locator('[data-testid^="column-"]').first();
  await firstColumn.getByRole("button", { name: "+ Add card" }).click();
  await firstColumn.getByPlaceholder(/card title/i).fill(cardTitle);
  await firstColumn.getByPlaceholder(/details/i).fill("Added via e2e.");
  await firstColumn.getByRole("button", { name: /^add$/i }).click();
  await expect(firstColumn.getByText(cardTitle)).toBeVisible();
});

test("moves a card between columns", async ({ page }) => {
  await page.goto("/");

  // Use a unique title so repeated runs don't collide on the same card name
  const cardTitle = `Drag-${Date.now()}`;

  const firstColumn = page.locator('[data-testid^="column-"]').first();
  await firstColumn.getByRole("button", { name: "+ Add card" }).click();
  await firstColumn.getByPlaceholder(/card title/i).fill(cardTitle);
  await firstColumn.getByRole("button", { name: /^add$/i }).click();
  await expect(firstColumn.getByText(cardTitle)).toBeVisible();

  const card = firstColumn.locator(`[data-testid^="card-"]`).filter({ hasText: cardTitle });
  const targetColumn = page.locator('[data-testid^="column-"]').nth(2);

  const cardBox = await card.boundingBox();
  const columnBox = await targetColumn.boundingBox();
  if (!cardBox || !columnBox) {
    throw new Error("Unable to resolve drag coordinates.");
  }

  await page.mouse.move(
    cardBox.x + cardBox.width / 2,
    cardBox.y + cardBox.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(
    columnBox.x + columnBox.width / 2,
    columnBox.y + 120,
    { steps: 12 }
  );
  await page.mouse.up();
  // Assert the specific card landed in the target column (not a count, which is sensitive to DB state)
  await expect(targetColumn.getByText(cardTitle)).toBeVisible();
});
