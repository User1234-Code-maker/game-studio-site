import { describe, expect, it } from "vitest";
import { isEmail, validateContact, validateField } from "./validation";

describe("validateField", () => {
  it("requires names and limits their length", () => {
    expect(validateField("firstName", "  ")).toBe("required");
    expect(validateField("lastName", "x".repeat(61))).toBe("too_long");
    expect(validateField("firstName", "Ada")).toBeNull();
  });

  it("checks the message length (10 to 2000)", () => {
    expect(validateField("message", "short")).toBe("too_short");
    expect(validateField("message", "x".repeat(2001))).toBe("too_long");
    expect(validateField("message", "Hello, a project idea.")).toBeNull();
  });
});

describe("isEmail", () => {
  it.each(["ada@example.com", "a@b.co", " kate@mail.ru "])("accepts %s", (value) => {
    expect(isEmail(value)).toBe(true);
  });
  it.each(["", "nope", "a@b", "a b@c.com", "a@b.c"])("rejects %j", (value) => {
    expect(isEmail(value)).toBe(false);
  });
});

describe("validateContact", () => {
  it("returns an error code for every wrong field and nothing for a good form", () => {
    expect(
      validateContact({ firstName: "", lastName: "X", email: "nope", message: "short" }),
    ).toEqual({
      firstName: "required",
      email: "invalid_email",
      message: "too_short",
    });
    expect(
      validateContact({
        firstName: "Ada",
        lastName: "L",
        email: "ada@example.com",
        message: "A long enough message",
      }),
    ).toEqual({});
  });
});
