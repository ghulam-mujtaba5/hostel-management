import { test, expect, devices } from '@playwright/test';

test.use({
  ...devices['Pixel 5'],
});

test('check live url on mobile', async ({ page }) => {
  // Set a timeout for the navigation
  page.setDefaultTimeout(30000);
  
  // Check for console errors
  page.on('console', msg => {
    console.log(`BROWSER LOG [${msg.type()}]: ${msg.text()}`);
  });

  console.log('Navigating to live URL...');
  const response = await page.goto('https://hostel-management-topaz-ten.vercel.app/');
  
  console.log('Response status:', response?.status());
  
  // Wait for a bit to see if it renders
  await page.waitForTimeout(10000);
  
  const title = await page.title();
  console.log('Page title:', title);
  
  const bodyText = await page.innerText('body');
  console.log('Body text:', bodyText.trim());
  console.log('Body text length:', bodyText.trim().length);
  
  // Check opacity of some elements
  const h1Opacity = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return h1 ? window.getComputedStyle(h1).opacity : 'not found';
  });
  console.log('H1 opacity:', h1Opacity);

  const bodyOpacity = await page.evaluate(() => window.getComputedStyle(document.body).opacity);
  console.log('Body opacity:', bodyOpacity);

  const mainOpacity = await page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? window.getComputedStyle(main).opacity : 'not found';
  });
  console.log('Main opacity:', mainOpacity);

  const mainVisibility = await page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? window.getComputedStyle(main).visibility : 'not found';
  });
  console.log('Main visibility:', mainVisibility);

  const mainDisplay = await page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? window.getComputedStyle(main).display : 'not found';
  });
  console.log('Main display:', mainDisplay);

  const mainContent = await page.innerHTML('body');
  console.log('Full body HTML:', mainContent);
  
  if (bodyText.trim().length < 100) {
    console.log('Page seems blank or nearly empty!');
    await page.screenshot({ path: 'mobile-blank-check.png', fullPage: true });
  }

  await expect(page).not.toHaveTitle(/Error/);
});
