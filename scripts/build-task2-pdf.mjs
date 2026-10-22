// Builds Task_2.pdf from docs/Task_2.md:
//   1. renders each ```mermaid block to SVG with mermaid-cli,
//   2. converts the Markdown to standalone HTML with Pandoc,
//   3. prints the HTML to PDF with a headless Chromium (Playwright).
//
// Requirements: pandoc on PATH; a Chromium-based browser. Set PLAYWRIGHT_CHANNEL=msedge|chrome
// to use an installed browser, or run `npx playwright install chromium` first.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "docs", "Task_2.md");
const buildDir = join(root, "docs", ".build");
const output = join(root, "Task_2.pdf");
const channel = process.env.PLAYWRIGHT_CHANNEL;
const isWindows = process.platform === "win32";

rmSync(buildDir, { recursive: true, force: true });
mkdirSync(buildDir, { recursive: true });

function browserExecutable() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = isWindows
    ? [
        "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
        "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
        "C:/Program Files/Google/Chrome/Application/chrome.exe",
      ]
    : ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
  return candidates.find((path) => existsSync(path));
}

function renderMermaid(markdown) {
  const puppeteerConfig = join(buildDir, "puppeteer.json");
  const executablePath = browserExecutable();
  writeFileSync(
    puppeteerConfig,
    JSON.stringify({ ...(executablePath ? { executablePath } : {}), args: ["--no-sandbox"] }),
  );
  const mermaidConfig = join(buildDir, "mermaid.json");
  writeFileSync(mermaidConfig, JSON.stringify({ theme: "neutral", fontFamily: "Segoe UI, Arial" }));

  // Paths are passed relative to the repo root: on Windows npx needs a shell, which would
  // split absolute paths containing spaces.
  const rel = (path) => relative(root, path).replaceAll("\\", "/");

  let index = 0;
  return markdown.replace(/```mermaid\n([\s\S]*?)```/g, (_match, diagram) => {
    index += 1;
    const input = join(buildDir, `diagram-${index}.mmd`);
    const svg = `diagram-${index}.svg`;
    writeFileSync(input, diagram);
    execFileSync(
      isWindows ? "npx.cmd" : "npx",
      [
        "-y",
        "@mermaid-js/mermaid-cli@11",
        "-q",
        "-i",
        rel(input),
        "-o",
        rel(join(buildDir, svg)),
        "-b",
        "white",
        "-p",
        rel(puppeteerConfig),
        "-c",
        rel(mermaidConfig),
      ],
      {
        cwd: root,
        stdio: "inherit",
        shell: isWindows,
        env: { ...process.env, PUPPETEER_SKIP_DOWNLOAD: "1" },
      },
    );
    console.log(`Rendered diagram ${index}`);
    return `![](${svg}){.diagram}\n`;
  });
}

const markdown = renderMermaid(readFileSync(source, "utf8").replace(/\r\n/g, "\n"));
const buildMarkdown = join(buildDir, "Task_2.md");
writeFileSync(buildMarkdown, markdown);

const html = join(buildDir, "Task_2.html");
execFileSync(
  "pandoc",
  [
    buildMarkdown,
    "--standalone",
    "--toc",
    "--toc-depth=2",
    "--embed-resources",
    `--resource-path=${buildDir}`,
    `--css=${join(root, "docs", "pdf.css")}`,
    "-o",
    html,
  ],
  { stdio: "inherit" },
);

const browser = await chromium.launch(channel ? { channel } : {});
const page = await browser.newPage();
await page.goto(pathToFileURL(html).href, { waitUntil: "load" });
await page.pdf({
  path: output,
  format: "A4",
  printBackground: true,
  margin: { top: "16mm", bottom: "18mm", left: "14mm", right: "14mm" },
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate:
    '<div style="font-size:8px;width:100%;text-align:center;color:#64748b">Internal Portal — Part 2 · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
});
await browser.close();
console.log(`Wrote ${output}`);
