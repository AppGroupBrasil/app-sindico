import { test, expect, Page } from '@playwright/test';

const EMAIL = process.env.E2E_EMAIL || 'eduardodominikus@hotmail.com';
const SENHA = process.env.E2E_SENHA || '123456';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByPlaceholder(/e-?mail/i).fill(EMAIL);
  await page.getByPlaceholder(/senha/i).first().fill(SENHA);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/(dashboard|sindico|home)/i, { timeout: 15_000 });
}

test('login → dashboard carrega', async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/dashboard|sindico|home/);
});

test('navega para Condomínios e lista é visível', async ({ page }) => {
  await login(page);
  await page.goto('/condominios');
  await expect(page.getByRole('heading', { name: /condom[ií]nios/i }).first()).toBeVisible();
});

test('navega para Ordens de Serviço e o botão Nova existe', async ({ page }) => {
  await login(page);
  await page.goto('/ordens-servico');
  const btn = page.getByRole('button', { name: /nova o\.?s\.?|nova ordem|criar ordem/i }).first();
  await expect(btn).toBeVisible();
});

test('navega para Documentos sem erro 5xx', async ({ page }) => {
  const erros: string[] = [];
  page.on('response', res => {
    if (res.status() >= 500 && res.url().includes('/api/')) erros.push(`${res.status()} ${res.url()}`);
  });
  await login(page);
  await page.goto('/documentos');
  await page.waitForLoadState('networkidle');
  expect(erros, `Erros 5xx em /api/: ${erros.join(', ')}`).toEqual([]);
});

test('navega para Relatórios e gráfico carrega', async ({ page }) => {
  await login(page);
  await page.goto('/relatorios');
  await expect(page.getByRole('heading', { name: /relat[óo]rios/i }).first()).toBeVisible();
});
