const puppeteer = require('puppeteer');

const URLS = [
  'https://samagama.in/faq',
  'https://samagama.in/overview',
];

async function scrapeSamagama() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const allFaqs = [];

  for (const url of URLS) {
    console.log(`\nFetching: ${url}`);
    try {
      const page = await browser.newPage();
      page.setDefaultTimeout(15000);

      // Intercept network requests to find API calls
      const apiCalls = [];
      page.on('response', (response) => {
        const reqUrl = response.url();
        if (reqUrl.includes('api') || reqUrl.includes('faq') || reqUrl.includes('data')) {
          apiCalls.push({ url: reqUrl, status: response.status() });
        }
      });

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

      // Wait a bit for dynamic content
      await page.evaluate(() => new Promise(r => setTimeout(r, 2000)));

      // Try to get page content
      const html = await page.content();

      // Try multiple extraction strategies
      const extracted = await page.evaluate(() => {
        const results = [];

        // Strategy 1: Look for FAQ structured data
        document.querySelectorAll('[class*="faq"], [class*="accordion"], [class*="question"], .qa-item, [itemprop="mainEntity"]').forEach(el => {
          const q = el.querySelector('[class*="question"], h3, h4, [itemprop="name"]')?.textContent?.trim();
          const a = el.querySelector('[class*="answer"], p, [itemprop="text"]')?.textContent?.trim();
          if (q && a && q.length > 5 && a.length > 5) results.push({ question: q, answer: a });
        });

        // Strategy 2: Look for JSON-LD structured data
        document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
          try {
            const data = JSON.parse(script.textContent);
            if (data.mainEntity) {
              data.mainEntity.forEach(item => {
                if (item.name && item.text) results.push({ question: item.name, answer: item.text });
              });
            }
          } catch {}
        });

        // Strategy 3: Look for next.js data
        document.querySelectorAll('script[id*="__NEXT"], script[data-name*="next"]').forEach(script => {
          try {
            const data = JSON.parse(script.textContent);
            results.push({ source: 'nextjs', data });
          } catch {}
        });

        // Strategy 4: Get all text content
        const bodyText = document.body?.innerText || '';
        if (bodyText.length > 100) {
          results.push({ source: 'body_text', length: bodyText.length, preview: bodyText.slice(0, 500) });
        }

        return results;
      });

      console.log(`Extraction results: ${JSON.stringify(extracted).slice(0, 1000)}`);

      // Try to get API calls
      if (apiCalls.length > 0) {
        console.log(`API calls found: ${apiCalls.map(a => a.url).join(', ')}`);
      }

      await page.close();
    } catch (err) {
      console.log(`Error fetching ${url}: ${err.message}`);
    }
  }

  await browser.close();
  console.log('\nDone.');
}

scrapeSamagama();
