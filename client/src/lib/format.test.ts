import { expect, it } from "vitest";
import { formatMoney } from "./format";

it("formats whole dollars without cents, in the language of the page", () => {
  expect(formatMoney(200_000, "en")).toBe("$2,000");
  expect(formatMoney(150_050, "en")).toBe("$1,500.50");
  expect(formatMoney(200_000, "ru")).toMatch(/2\s?000/);
});
