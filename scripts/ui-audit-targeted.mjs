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

function menuByLabel(label) {
  const t = cleanText(label).toLowerCase();
  for (const menu of EXPECTED_MENUS) {
    const m = menu.toLowerCase();
    if (t === m || t.includes(m) || m.includes(t)) return menu;
  }
  return cleanText(label);
}

async function tryLogin(page) {
  const user = page
    .locator("input[type='text'], input[name*='user' i], input[id*='user' i]")
    .first();
  const pass = page
    .locator("input[type='password'], input[name*='pass' i], input[id*='pass' i]")
    .first();

  if ((await user.count()) === 0 || (await pass.count()) === 0) return false;
  await user.fill(USERNAME).catch(() => {});
  await pass.fill(PASSWORD).catch(() => {});

  await page
    .locator("button:has-text('Login'), button:has-text('Sign in'), button[type='submit'], input[type='submit']")
    .first()
    .click()
    .catch(() => {});

  await page.waitForLoadState("domcontentloaded", { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(1000);
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
  for (let round = 0; round < 5; round += 1) {
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
    await page.waitForTimeout(200);
  }
}

async function collectLinks(sidebarRoot, baseUrl) {
  const items = await sidebarRoot.evaluate((root) => {
    const clean = (v) => (v || "").replace(/\s+/g, " ").trim();
    const links = Array.from(root.querySelectorAll("a[href]"));
    return links
      .map((a) => {
        const text = clean(a.textContent || "");
        const href = clean(a.getAttribute("href") || "");
        const li = a.closest("li");
        const parentLi = li?.parentElement?.closest("li");
        const parentLink = parentLi?.querySelector(":scope > a, :scope > button");
        const parent = clean(parentLink?.textContent || "");
        const visible = !!(a.offsetWidth || a.offsetHeight || a.getClientRects().length);
        return { text, href, parent, visible };
      })
      .filter((x) => x.visible && x.text && x.href && x.href !== "#");
  });

  const uniq = [];
  const seen = new Set();
  for (const it of items) {
    const hrefAbs = new URL(it.href, baseUrl).href;
    const key = `${it.parent}|${it.text}|${hrefAbs}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniq.push({ ...it, hrefAbs });
    }
  }
  return uniq;
}

async function collectInventory(page) {
  const uniq = (arr) => [...new Set(arr.map(cleanText).filter(Boolean))];

  const pageTitle = cleanText(await page.title().catch(() => ""));
  const header = await page
    .locator("main h1, .content-wrapper h1, h1, main h2, .content-header h1, .content-header h2, .page-title")
    .first()
    .textContent()
    .then(cleanText)
    .catch(() => "");

  const cards = await page
    .locator(".card-title, .card-header, .small-box .inner h3, .widget-title, [class*='card'] h3, [class*='card'] h4")
    .evaluateAll((els) => els.map((e) => (e.textContent || "").replace(/\s+/g, " ").trim()).filter(Boolean))
    .catch(() => []);

  const formFields = await page
    .evaluate(() => {
      const clean = (v) => (v || "").replace(/\s+/g, " ").trim();
      const out = [];
      for (const lb of Array.from(document.querySelectorAll("label"))) {
        const t = clean(lb.textContent || "");
        if (t) out.push(t);
      }
      for (const el of Array.from(document.querySelectorAll("input:not([type='hidden']), select, textarea"))) {
        const ph = clean(el.getAttribute("placeholder") || "");
        const nm = clean(el.getAttribute("name") || el.getAttribute("id") || "");
        if (ph) out.push(ph);
        else if (nm) out.push(nm);
      }
      return out;
    })
    .catch(() => []);

  const tableColumns = await page
    .locator("table thead th, .dataTables_wrapper thead th")
    .evaluateAll((ths) => ths.map((th) => (th.textContent || "").replace(/\s+/g, " ").trim()).filter(Boolean))
    .catch(() => []);

  const actionButtons = await page
    .locator("button, a.btn, input[type='button'], input[type='submit']")
    .evaluateAll((els) =>
      els
        .map((el) => ((el.textContent || el.getAttribute("value") || "").replace(/\s+/g, " ").trim()))
        .filter((t) => t && t.length < 80)
    )
    .catch(() => []);

  const workflowElements = await page
    .locator("[role='tab'], .nav-tabs .nav-link, .step, .wizard-step, .timeline-item")
    .evaluateAll((els) => els.map((e) => (e.textContent || "").replace(/\s+/g, " ").trim()).filter(Boolean))
    .catch(() => []);

  return {
    pageTitle,
    header,
    cards: uniq(cards).slice(0, 25),
    formFields: uniq(formFields).slice(0, 40),
    tableColumns: uniq(tableColumns).slice(0, 30),
    actionButtons: uniq(actionButtons).slice(0, 35),
    workflowElements: uniq(workflowElements).slice(0, 20),
  };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1600, height: 950 },
  });
  const page = await ctx.newPage();

  const report = {
    baseUrl: BASE_URL,
    visitedAt: new Date().toISOString(),
    discoveredLinks: [],
    pages: [],
    inaccessible: [],
    missingExpectedMenus: [],
  };

  try {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(1000);
    await tryLogin(page);
    await page.waitForTimeout(1200);

    const sidebarRoot = await getSidebarRoot(page);
    await expandSidebar(sidebarRoot, page);
    const links = await collectLinks(sidebarRoot, BASE_URL);
    report.discoveredLinks = links;

    const seenUrl = new Set();
    for (const link of links) {
      if (seenUrl.has(link.hrefAbs)) continue;
      seenUrl.add(link.hrefAbs);

      const menu = link.parent ? menuByLabel(link.parent) : menuByLabel(link.text);
      const submenu = link.parent ? cleanText(link.text) : "";

      try {
        console.log(`[targeted] ${menu} / ${submenu || "(root)"} -> ${link.hrefAbs}`);
        await page.goto(link.hrefAbs, { waitUntil: "domcontentloaded", timeout: 12000 });
        await page.waitForTimeout(600);
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
          menu,
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
    await fs.writeFile(
      "audit-output/ui-audit-targeted-report.json",
      JSON.stringify(report, null, 2),
      "utf8"
    );
    await page.screenshot({ path: "audit-output/targeted-final.png", fullPage: true }).catch(() => {});
    await browser.close();
  }
}

run();
