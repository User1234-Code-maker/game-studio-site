import { describe, expect, it } from "vitest";
import { bindShortWords } from "./typography";

const NB = " ";

describe("bindShortWords", () => {
  it("glues short Russian words to the next word", () => {
    expect(bindShortWords("от которых не оторваться", "ru")).toBe(`от${NB}которых не${NB}оторваться`);
    expect(bindShortWords("а не в срок", "ru")).toBe(`а${NB}не${NB}в${NB}срок`);
  });
  it("leaves words that merely contain a short word alone", () => {
    expect(bindShortWords("игры на заказ", "ru")).toBe(`игры на${NB}заказ`);
    expect(bindShortWords("кино окно", "ru")).toBe("кино окно");
  });
  it("keeps a dash with the word before it", () => {
    expect(bindShortWords("Студия — это люди", "ru")).toBe(`Студия${NB}— это люди`);
  });
  it("does nothing to English text", () => {
    expect(bindShortWords("a game in the box", "en")).toBe("a game in the box");
  });
});
