import { expect, type Page } from '@playwright/test';

export class AuthPage {
  constructor(private page: Page) {}

  async gotoLogin() {
    await this.page.goto('/login');
  }

  async gotoRegister() {
    await this.page.goto('/register');
  }

  async register(email: string, password: string) {
    await this.gotoRegister();
    await this.page.getByPlaceholder('user@acme.com').click();
    await this.page.getByPlaceholder('user@acme.com').fill(email);
    await this.page.getByLabel('Password').click();
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign Up' }).click();
  }

  async login(email: string, password: string) {
    await this.gotoLogin();
    await this.page.getByPlaceholder('user@acme.com').click();
    await this.page.getByPlaceholder('user@acme.com').fill(email);
    await this.page.getByLabel('Password').click();
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign In' }).click();
  }

  async logout(email: string, password: string) {
    await this.login(email, password);

    await this.page.waitForURL('/');
    await expect(this.page.getByPlaceholder('Send a message...')).toBeVisible();

    const sidebarToggleButton = this.page.getByTestId('sidebar-toggle-button');
    await sidebarToggleButton.click();

    const userNavButton = this.page.getByTestId('user-nav-button');
    await expect(userNavButton).toBeVisible();

    await userNavButton.click();
    const userNavMenu = this.page.getByTestId('user-nav-menu');
    await expect(userNavMenu).toBeVisible();

    const authMenuItem = this.page.getByTestId('user-nav-item-auth');
    await authMenuItem.click();

    await expect(this.page).toHaveURL('/login');
  }

  async expectToastToContain(text: string) {
    await expect(this.page.getByTestId('toast')).toContainText(text);
  }
}
