const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  await page.goto('http://localhost:5173/client/dashboard');
  
  // Wait a bit for the app to load
  await page.waitForTimeout(2000);
  
  // Dump the HTML inside the client-dashboard
  const html = await page.evaluate(() => {
    const dashboard = document.querySelector('client-dashboard');
    return dashboard ? dashboard.shadowRoot.innerHTML : 'No dashboard found';
  });
  
  console.log('DASHBOARD HTML:', html);
  
  await browser.close();
})();
