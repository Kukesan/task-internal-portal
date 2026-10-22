import { expect, test } from "@playwright/test";

test("sign up → sign out → sign in → create, update and delete a task → sign out", async ({
  page,
}) => {
  const email = `e2e-${Date.now()}@example.test`;
  const password = "e2e-password-123";

  await test.step("protected routes redirect anonymous users", async () => {
    await page.goto("/tasks");
    await expect(page).toHaveURL(/\/login\?next=%2Ftasks/);
  });

  await test.step("sign up lands on the empty task list", async () => {
    await page.getByRole("link", { name: "Create one" }).click();
    await page.getByLabel("Name").fill("E2E User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/tasks$/);
    await expect(page.getByRole("heading", { name: "No tasks yet" })).toBeVisible();
  });

  await test.step("sign out, then sign in again", async () => {
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Invalid email or password." }),
    ).toBeVisible();

    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/tasks$/);
  });

  await test.step("create a task", async () => {
    await page.getByRole("link", { name: "New task" }).first().click();
    await page.getByRole("button", { name: "Create task" }).click();
    await expect(page.getByText("Title is required")).toBeVisible();

    await page.getByLabel("Title").fill("Write the E2E test");
    await page.getByLabel("Priority").selectOption("HIGH");
    await page.getByRole("button", { name: "Create task" }).click();

    await expect(page).toHaveURL(/\/tasks$/);
    await expect(page.getByRole("heading", { name: "Write the E2E test" })).toBeVisible();
  });

  await test.step("change status inline (persists after reload)", async () => {
    const status = page.getByLabel("Status for “Write the E2E test”");
    await status.selectOption("DONE");
    await expect(status).toHaveValue("DONE");
    await page.reload();
    await expect(page.getByLabel("Status for “Write the E2E test”")).toHaveValue("DONE");
  });

  await test.step("delete with confirmation", async () => {
    await page.getByRole("button", { name: "Delete task “Write the E2E test”" }).click();
    const dialog = page.getByRole("dialog", { name: "Delete this task?" });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole("button", { name: "Delete task “Write the E2E test”" }).click();
    await dialog.getByRole("button", { name: "Delete task" }).click();
    await expect(page.getByRole("heading", { name: "No tasks yet" })).toBeVisible();
  });

  await test.step("sign out revokes access", async () => {
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/tasks");
    await expect(page).toHaveURL(/\/login/);
  });
});
