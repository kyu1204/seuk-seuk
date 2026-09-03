import { describe, expect, it } from "vitest";
import { deriveSenderName } from "./sender-name";

describe("deriveSenderName", () => {
  it("prefers the profile name the user set in 마이페이지", () => {
    expect(
      deriveSenderName(
        { email: "a@example.com", user_metadata: { full_name: "김민규 (MINT)" } },
        { name: "슥슥 스튜디오" }
      )
    ).toBe("슥슥 스튜디오");
    expect(
      deriveSenderName({ email: "a@example.com", user_metadata: { full_name: "Alice" } }, { name: "  " })
    ).toBe("Alice");
  });

  it("prefers user_metadata.full_name", () => {
    expect(
      deriveSenderName({
        email: "a@example.com",
        user_metadata: { full_name: "Alice", name: "Bob" },
      })
    ).toBe("Alice");
  });

  it("falls back to user_metadata.name", () => {
    expect(
      deriveSenderName({ email: "a@example.com", user_metadata: { name: "Bob" } })
    ).toBe("Bob");
  });

  it("falls back to the email local part", () => {
    expect(
      deriveSenderName({ email: "carol@example.com", user_metadata: null })
    ).toBe("carol");
  });

  it("returns empty string when nothing is available", () => {
    expect(deriveSenderName({ email: null, user_metadata: null })).toBe("");
    expect(deriveSenderName(null)).toBe("");
  });

  it("ignores non-string metadata values", () => {
    expect(
      deriveSenderName({
        email: "d@example.com",
        user_metadata: { full_name: 123, name: null },
      })
    ).toBe("d");
  });
});
