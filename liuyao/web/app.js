import { arrangeHexagram, castLine, interpretHexagram } from "./core.js";

const $ = (selector) => document.querySelector(selector);
const state = { values: Array(6).fill(7), mode: "manual", chart: null, reading: null, question: "", birthDate: "" };
let deferredInstall;
let toastTimer;
const today = new Date();
$("#birth-date").max = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function renderEditor() {
  const editor = $("#line-editor");
  editor.replaceChildren();
  for (let position = 6; position >= 1; position -= 1) {
    const index = position - 1;
    const label = document.createElement("label");
    label.className = "line-input";
    const caption = document.createElement("span");
    caption.textContent = `${position} 爻${position === 1 ? " · 初爻" : position === 6 ? " · 上爻" : ""}`;
    const select = document.createElement("select");
    select.setAttribute("aria-label", `${position}爻爻值`);
    [[6, "6 · 老阴 ⚋ 动"], [7, "7 · 少阳 ⚊"], [8, "8 · 少阴 ⚋"], [9, "9 · 老阳 ⚊ 动"]]
      .forEach(([value, text]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        select.append(option);
      });
    select.value = state.values[index];
    select.disabled = state.mode === "coins";
    select.addEventListener("change", () => { state.values[index] = Number(select.value); });
    label.append(caption, select);
    editor.append(label);
  }
}

function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll(".mode-button").forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  $("#coin-panel").hidden = mode !== "coins";
  $("#cast-button").hidden = mode !== "coins";
  $("#submit-button").textContent = mode === "coins" ? "使用当前爻值排盘 →" : "生成排盘 →";
  $("#coin-status").textContent = mode === "coins" ? "点击下方按钮模拟掷六次铜钱，按初爻到上爻记录。" : "";
  renderEditor();
}

document.querySelectorAll(".mode-button").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));

function glyphMarkup(yin) {
  return `<span class="line-glyph ${yin ? "yin" : "yang"}" aria-label="${yin ? "阴爻" : "阳爻"}"><i></i><i></i></span>`;
}

function renderChart(chart) {
  const container = $("#chart-lines");
  container.replaceChildren();
  for (let position = 6; position >= 1; position -= 1) {
    const line = chart.lines[position - 1];
    const changed = chart.changedLines[position - 1];
    const row = document.createElement("div");
    row.className = "chart-row";
    row.setAttribute("role", "row");
    const cells = [
      line.hidden ? `<span class="hidden-line">${line.hidden.relative}·${line.hidden.branch}</span>` : "—",
      `${line.stem}${line.branch}${line.element}`,
      line.relative,
      `${glyphMarkup(line.yin)}${line.moving ? '<span class="moving-mark">动</span>' : ""}`,
      line.shi ? '<span class="position-mark">世</span>' : line.ying ? '<span class="position-mark">应</span>' : "",
      line.moving ? `${changed.stem}${changed.branch}${changed.element} ${changed.relative}` : "—",
    ];
    cells.forEach((content) => {
      const cell = document.createElement("span");
      cell.innerHTML = content;
      row.append(cell);
    });
    container.append(row);
  }
  $("#gua-summary").innerHTML = `<div class="gua-card"><span>本卦</span><strong>${chart.original.name}</strong><small>第${chart.original.number}卦 · 下卦${chart.original.lower} · 上卦${chart.original.upper}</small></div><span class="gua-arrow" aria-hidden="true">${chart.lines.some((line) => line.moving) ? "→" : "＝"}</span><div class="gua-card"><span>变卦</span><strong>${chart.changed.name}</strong><small>第${chart.changed.number}卦 · 下卦${chart.changed.lower} · 上卦${chart.changed.upper}</small></div>`;
  const shi = chart.lines.find((line) => line.shi);
  const ying = chart.lines.find((line) => line.ying);
  $("#palace-summary").textContent = `${chart.palace.trigram}宫 · ${chart.palace.stage} · 宫五行属${chart.palace.element} · 世爻第${shi.position}位 · 应爻第${ying.position}位`;
}

function formatBirthDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function renderReading(chart, reading, question, birthDate) {
  renderChart(chart);
  $("#reading-heading").textContent = reading.title;
  $("#reading-list").replaceChildren(...reading.sections.map(({ title, content }) => {
    const item = document.createElement("article");
    item.className = "explanation-item";
    const heading = document.createElement("h4");
    heading.textContent = title;
    const paragraph = document.createElement("p");
    paragraph.textContent = content;
    item.append(heading, paragraph);
    return item;
  }));
  $("#disclaimer").textContent = reading.disclaimer;
  const questionSummary = $("#question-summary");
  const summary = [];
  if (question) summary.push(`所问：${question}`);
  if (birthDate) summary.push(`出生年月日：${formatBirthDate(birthDate)}`);
  questionSummary.hidden = summary.length === 0;
  questionSummary.textContent = summary.join("　｜　");
  $("#result").hidden = false;
}

function calculate() {
  try {
    state.chart = arrangeHexagram(state.values);
    state.question = $("#question").value.trim();
    state.birthDate = $("#birth-date").value;
    state.reading = interpretHexagram(state.chart, state.question);
    renderReading(state.chart, state.reading, state.question, state.birthDate);
    $("#form-message").textContent = "";
    $("#result").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    $("#form-message").textContent = error.message;
  }
}

$("#submit-button").addEventListener("click", calculate);
$("#cast-button").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  const status = $("#coin-status");
  const results = [];
  for (let i = 0; i < 6; i += 1) {
    const toss = castLine();
    results.push(toss.value);
    state.values[i] = toss.value;
    status.textContent = `第 ${i + 1} 次（${["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"][i]}）：${toss.coins.map((coin) => coin === 3 ? "正" : "反").join("、")}，${toss.value} 爻`;
    renderEditor();
    await new Promise((resolve) => setTimeout(resolve, 260));
  }
  status.textContent = `起卦完成：${results.map((value) => `${value}爻`).join("、")}（自下而上）`;
  button.disabled = false;
  calculate();
});

function buildResultText(chart, reading, question, birthDate) {
  const lines = [`${chart.original.name} → ${chart.changed.name}`, `${chart.palace.trigram}宫${chart.palace.stage} · ${chart.palace.element}行`];
  if (question) lines.push(`所问：${question}`);
  if (birthDate) lines.push(`出生年月日：${formatBirthDate(birthDate)}`);
  chart.lines.slice().reverse().forEach((line) => lines.push(`${line.hidden ? `${line.hidden.relative}伏神 ` : ""}${line.stem}${line.branch}${line.element} ${line.relative} ${line.shi ? "世" : line.ying ? "应" : ""} ${line.moving ? "动" : ""}`));
  reading.sections.forEach((section) => lines.push(`${section.title}：${section.content}`));
  lines.push(reading.disclaimer);
  return lines.join("\n");
}

function toast(message) {
  let element = $(".toast");
  if (!element) {
    element = document.createElement("div");
    element.className = "toast";
    element.setAttribute("role", "status");
    document.body.append(element);
  }
  element.textContent = message;
  element.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove("visible"), 1800);
}

$("#copy-button").addEventListener("click", async () => {
  if (!state.chart) return;
  try {
    await navigator.clipboard.writeText(buildResultText(state.chart, state.reading, state.question, state.birthDate));
    toast("排盘结果已复制");
  } catch {
    toast("复制失败，请检查浏览器权限");
  }
});

const HISTORY_KEY = "liuyao.history.v1";
function readHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
function showHistory() {
  const history = readHistory();
  const section = $("#history-section");
  section.hidden = history.length === 0;
  const list = $("#history-list");
  list.replaceChildren(...history.map((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "history-item";
    const info = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = item.chart.original.name;
    const detail = document.createElement("span");
    const details = [item.question || "未填写所问"];
    if (item.birthDate) details.push(`出生${formatBirthDate(item.birthDate)}`);
    details.push(new Date(item.createdAt).toLocaleString("zh-CN", { dateStyle: "short", timeStyle: "short" }));
    detail.textContent = details.join(" · ");
    info.append(title, detail);
    const arrow = document.createElement("span");
    arrow.className = "history-arrow";
    arrow.textContent = "↗";
    button.append(info, arrow);
    button.addEventListener("click", () => {
      state.values = item.values;
      state.chart = arrangeHexagram(item.values);
      state.question = item.question || "";
      state.birthDate = item.birthDate || "";
      state.reading = interpretHexagram(state.chart, state.question);
      $("#question").value = state.question;
      $("#birth-date").value = state.birthDate;
      renderEditor();
      renderReading(state.chart, state.reading, state.question, state.birthDate);
      $("#result").scrollIntoView({ behavior: "smooth" });
    });
    return button;
  }));
}

$("#save-button").addEventListener("click", () => {
  if (!state.chart) return;
  const item = {
    createdAt: new Date().toISOString(),
    values: [...state.values],
    question: state.question,
    birthDate: state.birthDate,
    chart: state.chart,
  };
  const history = [item, ...readHistory()].slice(0, 12);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  showHistory();
  toast("排盘已保存在此设备");
});
$("#clear-history").addEventListener("click", () => {
  localStorage.removeItem(HISTORY_KEY);
  showHistory();
  toast("记录已清空");
});

showHistory();
renderEditor();

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstall = event;
  $("#install-button").hidden = false;
});
$("#install-button").addEventListener("click", async () => {
  if (!deferredInstall) return;
  deferredInstall.prompt();
  await deferredInstall.userChoice;
  deferredInstall = null;
  $("#install-button").hidden = true;
});
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
}
