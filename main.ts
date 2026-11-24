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
  if (/\s/.test(word)) {
    problems.push("entry contains whitespace: it must be a single word");
  }
  if (!USERNAME_PATTERN.test(word)) {
    problems.push(
      "entry is not a well-formed make.fun username " +
        "(lowercase letters and digits, single hyphens between segments)",
    );
  }
  return problems;
}

function main(): void {
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

  // Read the file back and verify its bytes are exactly the entry word.
  const written = readFileSync(outPath, "utf8");
  if (written !== USERNAME + "\n") {
    console.error(
      "verification failed: entry.txt does not match the entry word byte-for-byte",
    );
    process.exit(1);
  }

  console.log(`wrote entry ${JSON.stringify(USERNAME)} to ${outPath}`);
}

main();
