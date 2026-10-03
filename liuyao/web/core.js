export const LINE_VALUES = Object.freeze([6, 7, 8, 9]);

export function lineFromValue(value) {
  if (!LINE_VALUES.includes(value)) {
    throw new RangeError("爻值必须是 6、7、8、9 之一");
  }

  return {
    value,
    yin: value === 6 || value === 8,
    moving: value === 6 || value === 9,
  };
}

export function validateLines(values) {
  if (!Array.isArray(values) || values.length !== 6) {
    throw new RangeError("一卦必须恰好包含六爻（自下而上）");
  }

  return values.map(lineFromValue);
}

export function castLine(random = Math.random) {
  const coins = Array.from({ length: 3 }, () => random() < 0.5 ? 2 : 3);
  return {
    coins,
    value: coins.reduce((sum, coin) => sum + coin, 0),
  };
}

export function castSixLines(random = Math.random) {
  return Array.from({ length: 6 }, () => castLine(random).value);
}

export function changedValues(values) {
  return validateLines(values).map(({ value, moving }) => moving ? (value === 6 ? 7 : 8) : value);
}

export function hexagramBits(values) {
  return validateLines(values).map(({ yin }) => yin ? 0 : 1);
}

const TRIGRAMS = Object.freeze({
  乾: { bits: "111", element: "金", innerStem: "甲", outerStem: "壬", inner: ["子", "寅", "辰"], outer: ["午", "申", "戌"] },
  兑: { bits: "110", element: "金", innerStem: "丁", outerStem: "丁", inner: ["巳", "卯", "丑"], outer: ["亥", "酉", "未"] },
  离: { bits: "101", element: "火", innerStem: "己", outerStem: "己", inner: ["卯", "丑", "亥"], outer: ["酉", "未", "巳"] },
  震: { bits: "100", element: "木", innerStem: "庚", outerStem: "庚", inner: ["子", "寅", "辰"], outer: ["午", "申", "戌"] },
  巽: { bits: "011", element: "木", innerStem: "辛", outerStem: "辛", inner: ["丑", "亥", "酉"], outer: ["未", "巳", "卯"] },
  坎: { bits: "010", element: "水", innerStem: "戊", outerStem: "戊", inner: ["寅", "辰", "午"], outer: ["申", "戌", "子"] },
  艮: { bits: "001", element: "土", innerStem: "丙", outerStem: "丙", inner: ["辰", "午", "申"], outer: ["戌", "子", "寅"] },
  坤: { bits: "000", element: "土", innerStem: "乙", outerStem: "癸", inner: ["未", "巳", "卯"], outer: ["丑", "亥", "酉"] },
});

const HEXAGRAMS = Object.freeze([
  ["乾", "乾", "乾为天"], ["坤", "坤", "坤为地"], ["震", "坎", "水雷屯"], ["坎", "艮", "山水蒙"],
  ["乾", "坎", "水天需"], ["坎", "乾", "天水讼"], ["坎", "坤", "地水师"], ["坤", "坎", "水地比"],
  ["乾", "巽", "风天小畜"], ["兑", "乾", "天泽履"], ["乾", "坤", "地天泰"], ["坤", "乾", "天地否"],
  ["离", "乾", "天火同人"], ["乾", "离", "火天大有"], ["艮", "坤", "地山谦"], ["坤", "震", "雷地豫"],
  ["震", "兑", "泽雷随"], ["巽", "艮", "山风蛊"], ["兑", "坤", "地泽临"], ["坤", "巽", "风地观"],
  ["震", "离", "火雷噬嗑"], ["离", "艮", "山火贲"], ["坤", "艮", "山地剥"], ["震", "坤", "地雷复"],
  ["震", "乾", "天雷无妄"], ["乾", "艮", "山天大畜"], ["震", "艮", "山雷颐"], ["巽", "兑", "泽风大过"],
  ["坎", "坎", "坎为水"], ["离", "离", "离为火"], ["艮", "兑", "泽山咸"], ["巽", "震", "雷风恒"],
  ["艮", "乾", "天山遁"], ["乾", "震", "雷天大壮"], ["坤", "离", "火地晋"], ["离", "坤", "地火明夷"],
  ["离", "巽", "风火家人"], ["兑", "离", "火泽睽"], ["艮", "坎", "水山蹇"], ["坎", "震", "雷水解"],
  ["兑", "艮", "山泽损"], ["震", "巽", "风雷益"],
  ["乾", "兑", "泽天夬"], ["巽", "乾", "天风姤"],
  ["坤", "兑", "泽地萃"], ["巽", "坤", "地风升"], ["坎", "兑", "泽水困"], ["巽", "坎", "水风井"],
  ["离", "兑", "泽火革"], ["巽", "离", "火风鼎"], ["震", "震", "震为雷"], ["艮", "艮", "艮为山"],
  ["艮", "巽", "风山渐"], ["兑", "震", "雷泽归妹"], ["离", "震", "雷火丰"], ["艮", "离", "火山旅"],
  ["巽", "巽", "巽为风"], ["兑", "兑", "兑为泽"], ["坎", "巽", "风水涣"], ["兑", "坎", "水泽节"],
  ["兑", "巽", "风泽中孚"], ["艮", "震", "雷山小过"], ["离", "坎", "水火既济"], ["坎", "离", "火水未济"],
].map(([lower, upper, name], index) => ({ lower, upper, name, number: index + 1 })));

const BRANCH_ELEMENTS = Object.freeze({
  子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火",
  午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水",
});
const GENERATES = Object.freeze({ 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" });
const CONTROLS = Object.freeze({ 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" });
const SIX_SPIRITS = Object.freeze(["青龙", "朱雀", "勾陈", "螣蛇", "白虎", "玄武"]);
const SPIRIT_START = Object.freeze({ 甲: 0, 乙: 0, 丙: 1, 丁: 1, 戊: 2, 己: 3, 庚: 4, 辛: 4, 壬: 5, 癸: 5 });
const PALACE_TRIGRAMS = Object.keys(TRIGRAMS);
const PALACE_STAGES = Object.freeze(["本宫", "一世", "二世", "三世", "四世", "五世", "游魂", "归魂"]);
const SHI_POSITIONS = Object.freeze([5, 0, 1, 2, 3, 4, 3, 2]);
const SIX_RELATIVES = Object.freeze(["兄弟", "子孙", "妻财", "官鬼", "父母"]);
const STEMS = Object.keys(SPIRIT_START);

function flip(bits, indexes) {
  const result = [...bits];
  indexes.forEach((index) => { result[index] = 1 - result[index]; });
  return result;
}

function palaceSequence(trigram) {
  const pure = [...(TRIGRAMS[trigram].bits + TRIGRAMS[trigram].bits)].map(Number);
  return [
    pure,
    flip(pure, [0]),
    flip(pure, [0, 1]),
    flip(pure, [0, 1, 2]),
    flip(pure, [0, 1, 2, 3]),
    flip(pure, [0, 1, 2, 3, 4]),
    flip(pure, [0, 1, 2, 4]),
    flip(pure, [4]),
  ];
  const stemByLine = bits.map((_, index) => index < 3 ? TRIGRAMS[lower.lower].innerStem : TRIGRAMS[upperTrigram].outerStem);
}

function findPalace(bits) {
  for (const trigram of PALACE_TRIGRAMS) {
    const sequence = palaceSequence(trigram);
    const stage = sequence.findIndex((candidate) => candidate.every((bit, index) => bit === bits[index]));
    if (stage >= 0) {
      return { trigram, stage, shi: SHI_POSITIONS[stage], ying: (SHI_POSITIONS[stage] + 3) % 6 };
    }
  }
  throw new Error("无法识别此卦的八宫归属");
}

function hexagramForBits(bits) {
  const lower = bits.slice(0, 3).join("");
  const upper = bits.slice(3, 6).join("");
  const entry = HEXAGRAMS.find((item) => TRIGRAMS[item.lower].bits === lower && TRIGRAMS[item.upper].bits === upper);
  if (!entry) {
    throw new Error("无法识别卦象");
  }
  return { ...entry, bits: [...bits] };
}

function relationFor(lineElement, palaceElement) {
  if (lineElement === palaceElement) return "兄弟";
  if (GENERATES[lineElement] === palaceElement) return "父母";
  if (GENERATES[palaceElement] === lineElement) return "子孙";
  if (CONTROLS[palaceElement] === lineElement) return "妻财";
  return "官鬼";
}

function buildLines(bits, palaceElement, palaceBits, dayStem, shi, ying) {
  const lower = hexagramForBits(bits);
  const upperTrigram = lower.upper;
  const branchByTrigram = [
    ...TRIGRAMS[lower.lower].inner,
    ...TRIGRAMS[upperTrigram].outer,
  ];
  const stemByLine = bits.map((_, index) => index < 3
    ? TRIGRAMS[lower.lower].innerStem
    : TRIGRAMS[upperTrigram].outerStem);
  const palaceGua = hexagramForBits(palaceBits);
  const palaceBranches = [
    ...TRIGRAMS[palaceGua.lower].inner,
    ...TRIGRAMS[palaceGua.upper].outer,
  ];
  const visibleRelatives = new Set(branchByTrigram.map((branch) => relationFor(BRANCH_ELEMENTS[branch], palaceElement)));
  const hiddenLines = palaceBranches
    .map((branch, index) => ({ branch, index, relative: relationFor(BRANCH_ELEMENTS[branch], palaceElement) }))
    .filter((line) => !visibleRelatives.has(line.relative));
  const spiritStart = dayStem ? SPIRIT_START[dayStem] : undefined;

  return bits.map((bit, index) => {
    const branch = branchByTrigram[index];
    const relative = relationFor(BRANCH_ELEMENTS[branch], palaceElement);
    const hidden = hiddenLines.find((line) => line.index === index);
    return {
      position: index + 1,
      yin: bit === 0,
      stem: stemByLine[index],
      branch,
      element: BRANCH_ELEMENTS[branch],
      relative,
      shi: index === shi,
      ying: index === ying,
      spirit: spiritStart === undefined ? "" : SIX_SPIRITS[(spiritStart + index) % SIX_SPIRITS.length],
      hidden: hidden ? { branch: hidden.branch, relative: hidden.relative } : null,
    };
  });
}

function getKongWang(dayStem, dayBranch) {
  const stemIndex = STEMS.indexOf(dayStem);
  const branchIndex = branchesIndex(dayBranch);
  if (stemIndex < 0 || branchIndex < 0) return [];
  const cycleIndex = Array.from({ length: 60 }, (_, index) => index)
    .find((index) => index % 10 === stemIndex && index % 12 === branchIndex);
  if (cycleIndex === undefined) return [];
  const xunStart = Math.floor(cycleIndex / 10) * 10;
  return [(xunStart + 10) % 12, (xunStart + 11) % 12];
}

function branchesIndex(branch) {
  return RULE_OPTIONS.branches.indexOf(branch);
}

export function arrangeHexagram(values, { dayStem = "", monthBranch = "", dayBranch = "" } = {}) {
  const lines = validateLines(values);
  const originalBits = hexagramBits(values);
  const changedBits = originalBits.map((bit, index) => lines[index].moving ? 1 - bit : bit);
  const original = hexagramForBits(originalBits);
  const changed = hexagramForBits(changedBits);
  const palace = findPalace(originalBits);
  const palaceElement = TRIGRAMS[palace.trigram].element;
  const palaceBits = palaceSequence(palace.trigram)[0];
  const kongWangIndexes = getKongWang(dayStem, dayBranch);
  const kongWang = kongWangIndexes.map((index) => RULE_OPTIONS.branches[index]);

  const annotated = buildLines(originalBits, palaceElement, palaceBits, dayStem, palace.shi, palace.ying)
    .map((line, index) => ({ ...line, moving: lines[index].moving, value: lines[index].value }));
  const changedLines = buildLines(changedBits, palaceElement, palaceBits, dayStem, palace.shi, palace.ying);
  const monthElement = BRANCH_ELEMENTS[monthBranch];
  const dayElement = BRANCH_ELEMENTS[dayBranch];
  const byMonth = (element) => {
    if (!monthElement) return "未填写月建";
    if (element === monthElement) return "旺";
    if (GENERATES[monthElement] === element) return "相";
    if (GENERATES[element] === monthElement) return "休";
    if (CONTROLS[monthElement] === element) return "囚";
    return "死";
  };

  return {
    original,
    changed,
    palace: { trigram: palace.trigram, element: palaceElement, stage: PALACE_STAGES[palace.stage] },
    lines: annotated.map((line) => ({
      ...line,
      void: kongWang.includes(line.branch),
      monthStrength: byMonth(line.element),
      supportedByDay: dayElement ? (line.element === dayElement || GENERATES[dayElement] === line.element) : null,
    })),
    changedLines,
    kongWang,
    rules: { dayStem, monthBranch, dayBranch },
  };
}

export function interpretHexagram(chart, question = "") {
  const positionNames = ["初", "二", "三", "四", "五", "上"];
  const relativeMeanings = {
    兄弟: "常用于观察同辈、合作竞争或资源分担",
    子孙: "常用于观察行动成果、产出或缓解压力的因素",
    妻财: "常用于观察资源、收益或具体事务成果",
    官鬼: "常用于观察职责、规则、压力或需要处理的事项",
    父母: "常用于观察信息、文书、支持或依托条件",
  };
  const movingLines = chart.lines.filter((line) => line.moving);
  const shiLine = chart.lines.find((line) => line.shi);
  const yingLine = chart.lines.find((line) => line.ying);
  const relatives = [...new Set(chart.lines.map((line) => line.relative))];
  const hiddenLines = chart.lines.filter((line) => line.hidden);
  const movementText = movingLines.length
    ? movingLines.map((line) => {
      const changed = chart.changedLines[line.position - 1];
      const from = line.yin ? "阴爻" : "阳爻";
      const to = line.yin ? "阳爻" : "阴爻";
      return `第${positionNames[line.position - 1]}爻由${from}变为${to}；本卦纳甲为${line.stem}${line.branch}${line.element}、属${line.relative}，变后为${changed.stem}${changed.branch}${changed.element}、属${changed.relative}。`;
    }).join(" ")
    : "本卦没有动爻，阴阳爻位不变；变卦与本卦相同。此时可先结合所问，观察本卦的世应与六亲分布。";
  const relativesText = relatives.map((relative) => {
    const positions = chart.lines.filter((line) => line.relative === relative).map((line) => `${positionNames[line.position - 1]}爻`);
    return `${relative}（${positions.join("、")}）：${relativeMeanings[relative]}。`;
  }).join(" ");
  const hiddenText = hiddenLines.length
    ? hiddenLines.map((line) => `第${positionNames[line.position - 1]}爻伏有${line.hidden.relative}${line.hidden.branch}。`).join(" ")
    : "本卦没有另外标出的伏神。";
  const questionText = question
    ? `本次所问为“${question}”。解读时应围绕这个具体问题确定用神；不同问题与流派的取用方法可能不同。`
    : "尚未填写具体所问。实际解读应先明确问题，再按问题选择用神，不能将所有六亲一概当作同一类事项。";

  return {
    title: "卦象逐项说明",
    sections: [
      {
        title: "一、整体卦象",
        content: `本卦为${chart.original.name}，第${chart.original.number}卦；归${chart.palace.trigram}宫${chart.palace.stage}，宫五行属${chart.palace.element}。本卦用于查看起卦时的结构；卦名本身不直接等于吉凶。${chart.lines.some((line) => line.moving) ? `动爻变化后为${chart.changed.name}，可作为变化方向的参考。` : ""}`,
      },
      { title: `二、动爻变化（${movingLines.length}处）`, content: movementText },
      {
        title: "三、世爻与应爻",
        content: `世爻在第${positionNames[shiLine.position - 1]}爻（${shiLine.stem}${shiLine.branch}${shiLine.element}，${shiLine.relative}），常作为求测一方的观察位置；应爻在第${positionNames[yingLine.position - 1]}爻（${yingLine.stem}${yingLine.branch}${yingLine.element}，${yingLine.relative}），常作为对方或外部环境的参照。两者关系要结合问题判断，不能单独据此下结论。`,
      },
      { title: "四、六亲分布与取用", content: `${relativesText}六亲由卦宫五行与爻支五行的生克关系排出。常见取象仅供理解，具体用神需依所问与所用流派确定。` },
      { title: "五、伏神", content: hiddenText },
      {
        title: "六、如何结合所问",
        content: `${questionText}建议先看与问题对应的用神，再结合其所在爻位、是否发动、与世应的关系综合分析；不要只依据单个爻或卦名作判断。`,
      },
      {
        title: "七、历法信息说明",
        content: "出生年月日仅作为求测者资料保存，不等同于起卦当天的日干支。本次未输入起卦日干支，因此不计算六神、旬空与月令旺衰；这些项目不能从出生日期推算。",
      },
    ],
    disclaimer: "以上为依据排盘结构生成的传统术数说明，流派取法存在差异，仅供学习与参考，不代表确定结果，也不替代专业意见。",
  };
}

export const RULE_OPTIONS = Object.freeze({
  stems: Object.keys(SPIRIT_START),
  branches: Object.keys(BRANCH_ELEMENTS),
  relatives: SIX_RELATIVES,
  hexagrams: HEXAGRAMS,
});
