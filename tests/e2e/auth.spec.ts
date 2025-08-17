import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form by default', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'FindMyDocs' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Senha')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('should toggle to signup form', async ({ page }) => {
    await page.getByRole('button', { name: 'Criar Conta' }).click();
    await expect(page.getByLabel('Nome')).toBeVisible();
    await expect(page.getByLabel('Sobrenome')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel(/Senha.*6 caracteres/)).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordField = page.getByLabel('Senha');
    const toggleButton = page.locator('[data-testid="password-toggle"]');
    
    await expect(passwordField).toHaveAttribute('type', 'password');
    await toggleButton.click();
    await expect(passwordField).toHaveAttribute('type', 'text');
  });

  test('should switch language', async ({ page }) => {
    await page.getByRole('button', { name: 'EN' }).click();
    await expect(page.getByRole('heading', { name: 'FindMyDocs' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    
    await page.getByRole('button', { name: 'PT' }).click();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('should handle invalid login', async ({ page }) => {
    await page.getByLabel('Email').fill('invalid@example.com');
    await page.getByLabel('Senha').fill('wrongpassword');
    await page.getByRole('button', { name: 'Entrar' }).click();
    
    // Should show error message (assuming backend returns error)
    await expect(page.getByText(/Email ou senha incorretos/)).toBeVisible();
  });
});
