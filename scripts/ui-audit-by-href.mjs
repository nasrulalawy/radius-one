import { chromium } from "playwright";
import fs from "node:fs/promises";

const BASE_URL = "https://demo.mixradius.com:2143/";
const USERNAME = "demo";
const PASSWORD = "demo";

const EXPECTED_MENUS = [
  "Users Session",
  "Dashboard",
  "App Settings",
  "Licence Info",
  "Router [ NAS ]",
  "ODP | POP Data",
  "Service Plan",
  "Customers",
  "Voucher Card",
  "Unpaid Invoice",
  "Finance Report",
  "Online Payment",
  "Support Tickets",
  "System Tools",
  "Software Logs",
  "Neighbor List",
  "PPPOE",
];

function cleanText(v) {
  return (v || "").replace(/\s+/g, " ").trim();
}

function normalizeExpected(text) {
  const t = cleanText(text).toLowerCase();
  for (const m of EXPECTED_MENUS) {
    const ml = m.toLowerCase();
    if (t === ml || t.includes(ml) || ml.includes(t)) return m;
  }
  return cleanText(text);
}

async function tryLogin(page) {
  const userInput = page
    .locator("input[type='text'], input[name*='user' i], input[id*='user' i]")
    .first();
  const passInput = page
    .locator("input[type='password'], input[name*='pass' i], input[id*='pass' i]")
    .first();

  if ((await userInput.count()) === 0 || (await passInput.count()) === 0) return false;
  await userInput.fill(USERNAME).catch(() => {});
  await passInput.fill(PASSWORD).catch(() => {});
  await page.locator("button:has-text('Login'), button:has-text('Sign in'), button[type='submit']").first().click().catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1200);
  return true;
}

async function getSidebarRoot(page) {
  for (const sel of ["aside", ".sidebar", "#sidebar", "[class*='sidebar']", "nav"]) {
    const root = page.locator(sel).first();
    if (await root.isVisible().catch(() => false)) return root;
  }
  return page.locator("body");
}

async function expandSidebar(sidebarRoot, page) {
  for (let round = 0; round < 4; round += 1) {
    const expanders = sidebarRoot.locator(
      "button[aria-expanded='false'], a[aria-expanded='false'], li.has-sub > a, li.treeview > a, .menu-item-has-children > a"
    );
    const count = await expanders.count();
    for (let i = 0; i < count; i += 1) {
      const el = expanders.nth(i);
      if (await el.isVisible().catch(() => false)) {
        await el.click({ timeout: 1000 }).catch(() => {});
      }
    }
    await page.waitForTimeout(250);
  }
}

async function collectSidebarLinks(sidebarRoot) {
  return sidebarRoot.evaluate((root) => {
    const clean = (v) => (v || "").replace(/\s+/g, " ").trim();
    const links = Array.from(root.querySelectorAll("a[href]"));
    const out = [];
    for (const a of links) {
      const text = clean(a.textContent || "");
      const href = clean(a.getAttribute("href") || "");
      if (!text || !href) continue;
      if (href === "#" || href.toLowerCase().startsWith("javascript")) continue;
      const li = a.closest("li");
      let parent = "";
      if (li) {
        const parentLi = li.parentElement?.closest("li");
        if (parentLi) {
          const firstLink = parentLi.querySelector(":scope > a, :scope > button");
          parent = clean(firstLink?.textContent || "");
        }
      }
      out.push({ text, href, parent });
    }
    return out;
  });
}

async function collectInventory(page) {
  const uniq = (arr) => [...new Set(arr.map(cleanText).filter(Boolean))];

  const header = await page
    .locator("main h1, h1, main h2, .page-title, .content-header h1, .content-header h2")
    .first()
    .textContent()
    .then(cleanText)
    .catch(() => "");

  const cards = await page
    .locator(
      ".card-title, .card-header, .small-box .inner h3, .widget-title, .stat-title, [class*='card'] h3, [class*='card'] h4"
    )
    .evaluateAll((els) => els.map((e) => (e.textContent || "").replace(/\s+/g, " ").trim()).filter(Boolean))
    .catch(() => []);

  const fields = await page
    .evaluate(() => {
      const clean = (v) => (v || "").replace(/\s+/g, " ").trim();
      const out = [];
      for (const lb of Array.from(document.querySelectorAll("label"))) {
        const t = clean(lb.textContent || "");
        if (t) out.push(t);
      }
      for (const el of Array.from(document.querySelectorAll("input:not([type='hidden']), select, textarea"))) {
        const ph = clean(el.getAttribute("placeholder") || "");
        const name = clean(el.getAttribute("name") || el.getAttribute("id") || "");
        if (ph) out.push(ph);
        else if (name) out.push(name);
      }
      return out;
    })
    .catch(() => []);

  const cols = await page
    .locator("table thead th, .dataTables_wrapper thead th")
    .evaluateAll((ths) => ths.map((th) => (th.textContent || "").replace(/\s+/g, " ").trim()).filter(Boolean))
    .catch(() => []);

  const buttons = await page
    .locator("button, a.btn, input[type='button'], input[type='submit']")
    .evaluateAll((els) =>
      els
        .map((el) => ((el.textContent || el.getAttribute("value") || "").replace(/\s+/g, " ").trim()))
        .filter((t) => t && t.length <= 70)
    )
    .catch(() => []);

  const workflow = await page
    .locator("[role='tab'], .nav-tabs .nav-link, .step, .wizard-step, .timeline-item")
    .evaluateAll((els) => els.map((e) => (e.textContent || "").replace(/\s+/g, " ").trim()).filter(Boolean))
    .catch(() => []);

  return {
    pageTitle: cleanText(await page.title().catch(() => "")),
    header,
    cards: uniq(cards).slice(0, 20),
    formFields: uniq(fields).slice(0, 30),
    tableColumns: uniq(cols).slice(0, 25),
    actionButtons: uniq(buttons).slice(0, 25),
    workflowElements: uniq(workflow).slice(0, 15),
  };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1600, height: 960 },
  });
  const page = await context.newPage();

  const report = {
    baseUrl: BASE_URL,
    visitedAt: new Date().toISOString(),
    discoveredLinks: [],
    pages: [],
    inaccessible: [],
    missingExpectedMenus: [],
  };

  try {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1200);
    await tryLogin(page);
    await page.waitForTimeout(1200);

    const sidebarRoot = await getSidebarRoot(page);
    await expandSidebar(sidebarRoot, page);
    const links = await collectSidebarLinks(sidebarRoot);

    const unique = [];
    const seen = new Set();
    for (const link of links) {
      const hrefAbs = new URL(link.href, BASE_URL).href;
      const key = `${link.text.toLowerCase()}|${hrefAbs.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push({ ...link, hrefAbs });
      }
    }
    report.discoveredLinks = unique;

    for (const link of unique) {
      const menu = normalizeExpected(link.parent || link.text);
      const submenu = link.parent ? cleanText(link.text) : "";
      try {
        console.log(`[href] ${link.text} -> ${link.hrefAbs}`);
        await page.goto(link.hrefAbs, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(800);
        const inv = await collectInventory(page);
        report.pages.push({
          menu,
          submenu,
          label: link.text,
          url: page.url(),
          ...inv,
        });
      } catch (err) {
        report.inaccessible.push({
          menu: menu || link.text,
          submenu,
          label: link.text,
          targetUrl: link.hrefAbs,
          reason: err.message,
        });
      }
    }

    const coveredMenus = new Set(report.pages.map((p) => p.menu));
    report.missingExpectedMenus = EXPECTED_MENUS.filter((m) => !coveredMenus.has(m));
  } catch (err) {
    report.inaccessible.push({
      menu: "Global",
      submenu: "",
      label: "Global",
      reason: err.message,
    });
  } finally {
    await fs.mkdir("audit-output", { recursive: true });
    await fs.writeFile("audit-output/ui-audit-href-report.json", JSON.stringify(report, null, 2), "utf8");
    await page.screenshot({ path: "audit-output/final-page-href.png", fullPage: true }).catch(() => {});
    await browser.close();
  }
}

run();
