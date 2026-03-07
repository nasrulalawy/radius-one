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

const REQUIRED_SUBMENU_PARENTS = new Set([
  "App Settings",
  "Users Session",
  "Service Plan",
  "Customers",
  "Voucher Card",
  "Finance Report",
  "Support Tickets",
  "System Tools",
  "Software Logs",
]);

function cleanText(v) {
  return (v || "").replace(/\s+/g, " ").trim();
}

function keyForPath(path) {
  return path.map((p) => p.toLowerCase()).join(" > ");
}

async function clickIfVisible(locator) {
  const count = await locator.count();
  if (!count) return false;
  for (let i = 0; i < count; i += 1) {
    const item = locator.nth(i);
    if (await item.isVisible().catch(() => false)) {
      await item.click({ timeout: 3000 }).catch(() => {});
      return true;
    }
  }
  return false;
}

async function getSidebarRoot(page) {
  const candidates = [
    "aside",
    ".sidebar",
    "#sidebar",
    "[class*='sidebar']",
    "nav",
  ];
  for (const sel of candidates) {
    const loc = page.locator(sel).first();
    if (await loc.isVisible().catch(() => false)) return loc;
  }
  return page.locator("body");
}

async function tryLogin(page) {
  const userInput = page
    .locator("input[type='text'], input[name*='user' i], input[id*='user' i]")
    .first();
  const passInput = page
    .locator("input[type='password'], input[name*='pass' i], input[id*='pass' i]")
    .first();

  if ((await userInput.count()) === 0 || (await passInput.count()) === 0) {
    return false;
  }

  await userInput.fill(USERNAME).catch(() => {});
  await passInput.fill(PASSWORD).catch(() => {});

  const submitted =
    (await clickIfVisible(page.locator("button:has-text('Login')"))) ||
    (await clickIfVisible(page.locator("button:has-text('Sign in')"))) ||
    (await clickIfVisible(page.locator("button[type='submit']"))) ||
    (await clickIfVisible(page.locator("input[type='submit']")));

  if (submitted) {
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);
  }
  return submitted;
}

async function expandAllPossibleSubmenus(page, sidebarRoot) {
  const expanders = sidebarRoot.locator(
    "button[aria-expanded='false'], a[aria-expanded='false'], li.has-sub > a, li.treeview > a, .menu-item-has-children > a"
  );
  const count = await expanders.count();
  for (let i = 0; i < count; i += 1) {
    const el = expanders.nth(i);
    if (await el.isVisible().catch(() => false)) {
      await el.click({ timeout: 1200 }).catch(() => {});
      await page.waitForTimeout(100);
    }
  }
}

async function getClickableSidebarItems(sidebarRoot) {
  const items = await sidebarRoot
    .locator("a, button")
    .evaluateAll((nodes) => {
      return nodes
        .map((el) => {
          const text = (el.textContent || "").replace(/\s+/g, " ").trim();
          const rect = el.getBoundingClientRect();
          const visible = rect.width > 0 && rect.height > 0;
          return {
            text,
            visible,
          };
        })
        .filter((x) => x.visible && x.text && x.text.length > 1);
    })
    .catch(() => []);

  const uniq = [];
  const seen = new Set();
  for (const it of items) {
    const t = cleanText(it.text);
    const k = t.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      uniq.push(t);
    }
  }
  return uniq;
}

async function clickSidebarText(page, sidebarRoot, text) {
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const exact = sidebarRoot.locator("a, button").filter({
    hasText: new RegExp(`^\\s*${escaped}\\s*$`, "i"),
  });
  if (await clickIfVisible(exact)) return true;

  const partial = sidebarRoot.locator("a, button").filter({
    hasText: new RegExp(escaped, "i"),
  });
  if (await clickIfVisible(partial)) return true;

  return false;
}

async function getActiveSidebarPath(sidebarRoot) {
  const active = await sidebarRoot
    .locator(
      "a.active, button.active, li.active > a, li.active > button, a[aria-current='page'], .router-link-active"
    )
    .evaluateAll((els) =>
      els
        .map((el) => (el.textContent || "").replace(/\s+/g, " ").trim())
        .filter(Boolean)
    )
    .catch(() => []);
  return [...new Set(active)].map(cleanText);
}

async function collectPageInventory(page) {
  const pageTitle = await page.title().catch(() => "");
  const header = await page
    .locator("main h1, h1, main h2, .page-title, .content-header h1, .content-header h2")
    .first()
    .textContent()
    .then(cleanText)
    .catch(() => "");

  const cards = await page
    .locator(
      ".card-title, .card-header, .small-box .inner h3, .widget-title, .stat-title, .tile-title, [class*='card'] h3, [class*='card'] h4"
    )
    .evaluateAll((els) =>
      els
        .map((el) => (el.textContent || "").replace(/\s+/g, " ").trim())
        .filter((t) => t.length > 0 && t.length < 120)
    )
    .catch(() => []);

  const formFields = await page
    .evaluate(() => {
      const labels = Array.from(document.querySelectorAll("label"));
      const out = [];
      for (const lb of labels) {
        const text = (lb.textContent || "").replace(/\s+/g, " ").trim();
        if (text) out.push(text);
      }
      const inputs = Array.from(
        document.querySelectorAll(
          "input:not([type='hidden']), select, textarea"
        )
      );
      for (const el of inputs) {
        const ph =
          (el.getAttribute("placeholder") || "").replace(/\s+/g, " ").trim() ||
          "";
        const name =
          (el.getAttribute("name") || el.getAttribute("id") || "")
            .replace(/\s+/g, " ")
            .trim() || "";
        const tag = el.tagName.toLowerCase();
        const type = (el.getAttribute("type") || "").toLowerCase();
        const val = ph || name || `${tag}${type ? `:${type}` : ""}`;
        if (val) out.push(val);
      }
      return out;
    })
    .catch(() => []);

  const tableColumns = await page
    .locator("table thead th, .dataTables_wrapper thead th")
    .evaluateAll((ths) =>
      ths
        .map((th) => (th.textContent || "").replace(/\s+/g, " ").trim())
        .filter(Boolean)
    )
    .catch(() => []);

  const buttons = await page
    .locator("button, a.btn, input[type='button'], input[type='submit']")
    .evaluateAll((els) =>
      els
        .map((el) => {
          const txt =
            (el.textContent || el.getAttribute("value") || "")
              .replace(/\s+/g, " ")
              .trim() || "";
          return txt;
        })
        .filter((t) => t && t.length <= 70)
    )
    .catch(() => []);

  const tabs = await page
    .locator("[role='tab'], .nav-tabs .nav-link, .steps li, .step, .wizard-step")
    .evaluateAll((els) =>
      els
        .map((el) => (el.textContent || "").replace(/\s+/g, " ").trim())
        .filter(Boolean)
    )
    .catch(() => []);

  const uniq = (arr) => [...new Set(arr.map(cleanText).filter(Boolean))];

  return {
    pageTitle: cleanText(pageTitle),
    header,
    cards: uniq(cards).slice(0, 20),
    formFields: uniq(formFields).slice(0, 35),
    tableColumns: uniq(tableColumns).slice(0, 30),
    actionButtons: uniq(buttons).slice(0, 30),
    workflowElements: uniq(tabs).slice(0, 20),
  };
}

function normalizeMenuLabel(text) {
  const t = text.toLowerCase();
  for (const expected of EXPECTED_MENUS) {
    const e = expected.toLowerCase();
    if (t === e) return expected;
    if (t.includes(e) || e.includes(t)) return expected;
  }
  return text;
}

function parsePath(clickedText, activePath) {
  const activeNorm = activePath.map(cleanText).filter(Boolean);
  let menu = "";
  let submenu = "";

  for (const token of activeNorm) {
    const maybe = normalizeMenuLabel(token);
    if (EXPECTED_MENUS.includes(maybe)) {
      menu = maybe;
      break;
    }
  }
  if (!menu) {
    menu = normalizeMenuLabel(clickedText);
    if (!EXPECTED_MENUS.includes(menu)) {
      const maybe = EXPECTED_MENUS.find((m) =>
        clickedText.toLowerCase().includes(m.toLowerCase())
      );
      if (maybe) menu = maybe;
    }
  }

  if (activeNorm.length > 1) {
    submenu = activeNorm[activeNorm.length - 1];
  } else if (menu && clickedText && cleanText(clickedText) !== menu) {
    submenu = cleanText(clickedText);
  }

  if (!EXPECTED_MENUS.includes(menu)) {
    submenu = clickedText;
    menu = "Unmapped Sidebar";
  }

  if (submenu && submenu.toLowerCase() === menu.toLowerCase()) submenu = "";
  return { menu, submenu };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1660, height: 980 },
  });
  const page = await context.newPage();

  const report = {
    baseUrl: BASE_URL,
    visitedAt: new Date().toISOString(),
    menuItemsVisible: [],
    pages: [],
    inaccessible: [],
    missingExpectedMenus: [],
    submenuCoverageGaps: [],
  };

  try {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1500);
    await tryLogin(page);
    await page.waitForTimeout(1500);

    const sidebarRoot = await getSidebarRoot(page);
    await expandAllPossibleSubmenus(page, sidebarRoot);
    await page.waitForTimeout(600);

    const visibleTexts = await getClickableSidebarItems(sidebarRoot);
    report.menuItemsVisible = visibleTexts;

    const queue = [...visibleTexts];
    const seenClicks = new Set();
    const visitedPaths = new Set();
    const menuToSubmenuSet = new Map();
    const discoveredLabels = new Set(queue.map((q) => q.toLowerCase()));
    const started = Date.now();
    const MAX_RUNTIME_MS = 8 * 60 * 1000;
    const MAX_CLICKS = 260;
    let clickCount = 0;

    while (queue.length) {
      if (Date.now() - started > MAX_RUNTIME_MS) {
        report.inaccessible.push({
          menuOrItem: "Global",
          reason: "Stopped crawl after reaching max runtime (8 minutes)",
        });
        break;
      }
      if (clickCount >= MAX_CLICKS) {
        report.inaccessible.push({
          menuOrItem: "Global",
          reason: `Stopped crawl after reaching max click limit (${MAX_CLICKS})`,
        });
        break;
      }
      const label = queue.shift();
      if (!label) continue;
      const clickKey = label.toLowerCase();
      if (seenClicks.has(clickKey)) continue;
      seenClicks.add(clickKey);
      clickCount += 1;
      console.log(`[crawl] click ${clickCount}: ${label}`);

      const clicked = await clickSidebarText(page, sidebarRoot, label);
      if (!clicked) {
        report.inaccessible.push({
          menuOrItem: label,
          reason: "Clickable element not found/visible at click time",
        });
        continue;
      }

      await page.waitForLoadState("domcontentloaded", { timeout: 12000 }).catch(() => {});
      await page.waitForTimeout(900);
      await expandAllPossibleSubmenus(page, sidebarRoot);
      await page.waitForTimeout(300);

      const activePath = await getActiveSidebarPath(sidebarRoot);
      const { menu, submenu } = parsePath(label, activePath);
      const path = submenu ? [menu, submenu] : [menu];
      const pathKey = keyForPath(path);
      if (visitedPaths.has(pathKey)) {
        const newer = await getClickableSidebarItems(sidebarRoot);
        for (const n of newer) {
          const k = n.toLowerCase();
          if (!seenClicks.has(k) && !discoveredLabels.has(k)) {
            discoveredLabels.add(k);
            queue.push(n);
          }
        }
        continue;
      }
      visitedPaths.add(pathKey);

      if (!menuToSubmenuSet.has(menu)) menuToSubmenuSet.set(menu, new Set());
      if (submenu) menuToSubmenuSet.get(menu).add(submenu);

      const inv = await collectPageInventory(page);
      report.pages.push({
        menu,
        submenu,
        clickedLabel: label,
        url: page.url(),
        activePath,
        ...inv,
      });

      const newer = await getClickableSidebarItems(sidebarRoot);
      for (const n of newer) {
        const k = n.toLowerCase();
        if (!seenClicks.has(k) && !discoveredLabels.has(k)) {
          discoveredLabels.add(k);
          queue.push(n);
        }
      }
    }

    report.missingExpectedMenus = EXPECTED_MENUS.filter((m) => {
      const has = report.pages.some((p) => p.menu === m);
      return !has;
    });

    report.submenuCoverageGaps = Array.from(REQUIRED_SUBMENU_PARENTS).filter(
      (m) => (menuToSubmenuSet.get(m)?.size || 0) === 0
    );
  } catch (err) {
    report.inaccessible.push({
      menuOrItem: "Global",
      reason: `Automation error: ${err.message}`,
    });
  } finally {
    await fs.mkdir("audit-output", { recursive: true });
    await fs.writeFile(
      "audit-output/ui-audit-report.json",
      JSON.stringify(report, null, 2),
      "utf8"
    );
    await page.screenshot({
      path: "audit-output/final-page.png",
      fullPage: true,
    }).catch(() => {});
    await browser.close();
  }
}

run();
