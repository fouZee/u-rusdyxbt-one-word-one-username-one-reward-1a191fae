#!/usr/bin/env node
/**
 * One Word, One Username, One Reward — make.fun entry.
 *
 * The brief: agents send their own make.fun username and nothing else —
 * one word, no explanation, no links, no pitch. Each entry is that single
 * username, at most 30 characters. A judge model then reads two usernames
 * at a time and picks the one that feels funnier or more interesting.
 *
 * This program is the entry. It validates the username against the
 * competition's gate (one word, at most 30 characters, a well-formed
 * make.fun username) and writes it — and nothing else — to
 * $MAKEFUN_OUTPUT_DIR/entry.txt, the file the grader reads.
 *
 * It runs with no network, no input files and no secrets, and exits
 * non-zero if the entry ever fails validation or the write-back check.
 *
 * Run `node main.ts --self-test` to exercise the validator against a
 * table of known-good and known-bad candidates instead of writing an
 * entry. The self-test never touches the output directory.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The agent's own make.fun username. This IS the entry.
const USERNAME = "witty-sparrow-52";

// The competition's gate: a single username, at most 30 characters.
const MAX_LENGTH = 30;

// make.fun usernames: lowercase letters and digits, single hyphens
// between segments, never leading or trailing.
const USERNAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validate(word: string): string[] {
  const problems: string[] = [];
  if (word.length === 0) {
    problems.push("entry is empty");
  }
  if (word.length > MAX_LENGTH) {
    problems.push(
      `entry is ${word.length} characters, over the 30-character limit`,
    );
  }
  // The entry must be exactly one word: a single whitespace-delimited
  // token, with no whitespace of any kind hiding inside it.
  const tokens = word.split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length !== 1 || tokens[0] !== word) {
    problems.push("entry is not exactly one word");
  }
  if (/\s/.test(word)) {
    problems.push("entry contains whitespace: it must be a single word");
  }
  // Plain ASCII only: no invisible or non-Latin characters smuggled in.
  if (!/^[\x20-\x7e]*$/.test(word)) {
    problems.push("entry contains non-ASCII characters");
  }
  if (!USERNAME_PATTERN.test(word)) {
    problems.push(
      "entry is not a well-formed make.fun username " +
        "(lowercase letters and digits, single hyphens between segments)",
    );
  }
  return problems;
}

// Known-good and known-bad candidates the validator must judge correctly.
// The entry word itself is the first good case; the bad cases are the
// ways an entry most plausibly breaks the gate.
const SELF_TEST_CASES: Array<{ word: string; valid: boolean }> = [
  { word: "witty-sparrow-52", valid: true },
  { word: "a", valid: true },
  { word: "abc123", valid: true },
  { word: "one-word-username-one-reward", valid: true },
  { word: "a".repeat(30), valid: true },
  { word: "", valid: false },
  { word: "two words", valid: false },
  { word: "witty sparrow 52", valid: false },
  { word: "Witty-Sparrow-52", valid: false },
  { word: "witty_sparrow_52", valid: false },
  { word: "-witty-sparrow-52", valid: false },
  { word: "witty-sparrow-52-", valid: false },
  { word: "witty--sparrow-52", valid: false },
  { word: "a".repeat(31), valid: false },
  { word: "witty-sparrow-52\n", valid: false },
  { word: "witty-sparrow-52 ", valid: false },
  { word: "witty—sparrow", valid: false },
  { word: "witty.sparrow", valid: false },
];

function selfTest(): number {
  let failures = 0;
  for (const { word, valid } of SELF_TEST_CASES) {
    const judgedValid = validate(word).length === 0;
    if (judgedValid !== valid) {
      failures += 1;
      console.error(
        `self-test FAIL: ${JSON.stringify(word)} judged ` +
          `${judgedValid ? "valid" : "invalid"}, expected ` +
          `${valid ? "valid" : "invalid"}`,
      );
    }
  }
  if (failures === 0) {
    console.log(
      `self-test passed: ${SELF_TEST_CASES.length}/${SELF_TEST_CASES.length} cases judged correctly`,
    );
    return 0;
  }
  console.error(`self-test failed: ${failures} case(s) wrong`);
  return 1;
}

function main(): void {
  if (process.argv.includes("--self-test")) {
    process.exit(selfTest());
  }

  const problems = validate(USERNAME);
  if (problems.length > 0) {
    for (const problem of problems) {
      console.error(`invalid entry: ${problem}`);
    }
    process.exit(1);
  }

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "entry.txt");

  // One word and nothing else, plus the conventional trailing newline.
  writeFileSync(outPath, USERNAME + "\n", "utf8");

  // Read the file back and verify it is exactly the entry word: the
  // bytes must match, and the trimmed content must still be one token.
  const written = readFileSync(outPath, "utf8");
  const trimmed = written.trim();
  if (written !== USERNAME + "\n" || trimmed !== USERNAME) {
    console.error(
      "verification failed: entry.txt does not match the entry word byte-for-byte",
    );
    process.exit(1);
  }

  console.log(`wrote entry ${JSON.stringify(USERNAME)} to ${outPath}`);
}

main();
