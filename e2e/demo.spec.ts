import { test, expect } from '@playwright/test';

test.describe('Immobil - Scénario de démonstration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');
  });

  test('Connexion et navigation dashboard', async ({ page }) => {
    // Should see login page
    await expect(page.locator('h1, h2')).toContainText('Connexion');
    
    // Fill login form (assuming test user exists)
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should navigate to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1')).toContainText('Tableau de bord');
  });

  test('Création d\'un bien', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to properties
    await page.click('a[href="/biens"]');

    // Click "Nouveau bien"
    await page.click('button:has-text("Nouveau bien")');

    // Fill property form
    await page.fill('input[name="name"]', 'Test Property');
    await page.selectOption('select[name="type"]', 'Immeuble');
    await page.fill('input[name="address"]', '123 Test Street');
    await page.fill('input[name="city"]', 'Test City');

    // Save
    await page.click('button:has-text("Enregistrer")');

    // Should see success message
    await expect(page.locator('text=Bien enregistré')).toBeVisible();
  });

  test('Création d\'un locataire', async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to tenants
    await page.click('a[href="/locataires"]');

    // Click "Nouveau locataire"
    await page.click('button:has-text("Nouveau locataire")');

    // Fill tenant form
    await page.fill('input[name="full_name"]', 'John Doe');
    await page.fill('input[name="phone"]', '+33612345678');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="rent_amount"]', '50000');

    // Save
    await page.click('button:has-text("Enregistrer")');

    // Should see success message
    await expect(page.locator('text=Locataire enregistré')).toBeVisible();
  });

  test('Création d\'une unité', async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to units via properties
    await page.click('a[href="/biens"]');
    await page.click('button:has-text("Nouvelle unité")');

    // Fill unit form
    await page.selectOption('select[name="property_id"]', '1'); // Assuming property exists
    await page.fill('input[name="label"]', 'Unit 1');
    await page.selectOption('select[name="type"]', 'Appartement');
    await page.fill('input[name="rent_amount"]', '50000');

    // Save
    await page.click('button:has-text("Enregistrer")');

    // Should see success message
    await expect(page.locator('text=Unité enregistrée')).toBeVisible();
  });

  test('Création d\'un bail', async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to leases
    await page.click('a[href="/baux"]');

    // Click "Nouveau bail"
    await page.click('button:has-text("Nouveau bail")');

    // Fill lease form
    await page.selectOption('select[name="unit_id"]', '1');
    await page.selectOption('select[name="tenant_id"]', '1');
    await page.fill('input[name="start_date"]', '2024-01-01');
    await page.fill('input[name="rent_amount"]', '50000');
    await page.fill('input[name="due_day"]', '5');

    // Save
    await page.click('button:has-text("Enregistrer")');

    // Should see success message
    await expect(page.locator('text=Bail enregistré')).toBeVisible();
  });

  test('Enregistrement d\'un paiement', async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to rent schedule
    await page.click('a[href="/echeances"]');

    // Click "Encaisser" on first due
    await page.click('button:has-text("Encaisser")').first();

    // Fill payment form
    await page.fill('input[name="amount"]', '50000');
    await page.selectOption('select[name="method"]', 'Espèces');
    await page.fill('input[name="payment_date"]', '2024-01-05');

    // Save
    await page.click('button:has-text("Enregistrer")');

    // Should see success message
    await expect(page.locator('text=Paiement enregistré')).toBeVisible();
  });

  test('Consultation de la quittance', async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to payments
    await page.click('a[href="/paiements"]');

    // Click "Quittance" on first payment
    await page.click('button:has-text("Quittance")').first();

    // Should see receipt page
    await expect(page.locator('text=Quittance de loyer')).toBeVisible();
    await expect(page.locator('text=N°')).toBeVisible();
  });

  test('Création d\'une dépense', async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to expenses
    await page.click('a[href="/depenses"]');

    // Click "Nouvelle dépense"
    await page.click('button:has-text("Nouvelle dépense")');

    // Fill expense form
    await page.fill('input[name="label"]', 'Plomberie');
    await page.selectOption('select[name="category"]', 'Plomberie');
    await page.fill('input[name="amount"]', '15000');
    await page.fill('input[name="expense_date"]', '2024-01-10');
    await page.fill('input[name="vendor"]', 'Plombier Test');

    // Save
    await page.click('button:has-text("Enregistrer")');

    // Should see success message
    await expect(page.locator('text=Dépense enregistrée')).toBeVisible();
  });

  test('Consultation des bilans', async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to reports
    await page.click('a[href="/bilans"]');

    // Should see KPI cards
    await expect(page.locator('text=Revenus encaissés')).toBeVisible();
    await expect(page.locator('text=Dépenses payées')).toBeVisible();
    await expect(page.locator('text=Résultat net')).toBeVisible();
    await expect(page.locator('text=Taux de recouvrement')).toBeVisible();
  });
});
