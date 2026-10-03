import assert from "node:assert/strict";
import test from "node:test";
import {
  arrangeHexagram,
  castLine,
  castSixLines,
  changedValues,
  hexagramBits,
  interpretHexagram,
  lineFromValue,
  RULE_OPTIONS,
  validateLines,
} from "../web/core.js";

const seeded = (...values) => {
  let index = 0;
  return () => values[index++];
};

test("爻值校验及动爻变爻规则正确", () => {
  assert.deepEqual(validateLines([6, 7, 8, 9, 7, 8]).map((line) => [line.yin, line.moving]), [
    [true, true], [false, false], [true, false], [false, true], [false, false], [true, false],
  ]);
  assert.deepEqual(changedValues([6, 7, 8, 9, 6, 9]), [7, 7, 8, 8, 7, 8]);
  assert.throws(() => lineFromValue(5), RangeError);
  assert.throws(() => validateLines([7, 7]), RangeError);
});

test("铜钱三枚组合映射为 6、7、8、9", () => {
  assert.equal(castLine(seeded(0.1, 0.2, 0.3)).value, 6);
  assert.equal(castLine(seeded(0.9, 0.1, 0.1)).value, 7);
  assert.equal(castLine(seeded(0.9, 0.9, 0.1)).value, 8);
  assert.equal(castLine(seeded(0.9, 0.9, 0.9)).value, 9);
  assert.deepEqual(castSixLines(seeded(0.1, 0.1, 0.1, 0.9, 0.1, 0.1, 0.9, 0.9, 0.1, 0.9, 0.9, 0.9, 0.1, 0.1, 0.1, 0.9, 0.9, 0.9)), [6, 7, 8, 9, 6, 9]);
});

test("六十四卦资料唯一且每种阴阳组合都能排盘", () => {
  assert.equal(RULE_OPTIONS.hexagrams.length, 64);
  assert.deepEqual(RULE_OPTIONS.hexagrams.map((gua) => gua.number), Array.from({ length: 64 }, (_, index) => index + 1));
  const names = new Set();
  const palaces = new Set();
  for (let mask = 0; mask < 64; mask += 1) {
    const values = Array.from({ length: 6 }, (_, index) => (mask >> index) & 1 ? 7 : 8);
    const chart = arrangeHexagram(values, { dayStem: "甲", monthBranch: "寅", dayBranch: "子" });
    assert.equal(chart.lines.length, 6);
    assert.equal(chart.changedLines.length, 6);
    assert.equal(chart.original.bits.join(""), hexagramBits(values).join(""));
    names.add(chart.original.name);
    palaces.add(`${chart.palace.trigram}-${chart.palace.stage}`);
  }
  assert.equal(names.size, 64);
  assert.equal(palaces.size, 64);
});

test("乾宫纳甲干支、世应、六神及旬空排布正确", () => {
  const chart = arrangeHexagram([7, 7, 7, 7, 7, 7], { dayStem: "甲", monthBranch: "寅", dayBranch: "子" });
  assert.equal(chart.original.name, "乾为天");
  assert.deepEqual(chart.lines.map((line) => `${line.stem}${line.branch}`), ["甲子", "甲寅", "甲辰", "壬午", "壬申", "壬戌"]);
  assert.equal(chart.lines[5].shi, true);
  assert.equal(chart.lines[2].ying, true);
  assert.equal(chart.lines[0].spirit, "青龙");
  assert.equal(chart.lines[5].spirit, "玄武");
  assert.deepEqual(chart.kongWang, ["戌", "亥"]);
  assert.equal(chart.lines[5].void, true);
  assert.deepEqual(arrangeHexagram([7, 7, 7, 7, 7, 7], { dayStem: "甲", dayBranch: "丑" }).kongWang, []);
});

test("逐项解读说明本卦、动爻、世应、六亲与历法限制", () => {
  const chart = arrangeHexagram([6, 7, 8, 9, 7, 7]);
  const reading = interpretHexagram(chart, "工作发展");
  assert.equal(reading.sections.length, 7);
  assert.match(reading.sections[0].content, /本卦为/);
  assert.match(reading.sections[1].content, /第初爻由阴爻变为阳爻/);
  assert.match(reading.sections[2].content, /世爻/);
  assert.match(reading.sections[3].content, /六亲由卦宫五行/);
  assert.match(reading.sections[5].content, /工作发展/);
  assert.match(reading.sections[6].content, /不计算六神、旬空与月令旺衰/);
  assert.match(reading.disclaimer, /仅供学习与参考/);
});
