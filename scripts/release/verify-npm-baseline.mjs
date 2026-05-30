import { execSync } from "node:child_process";

const version = execSync("npm --version", { encoding: "utf8" }).trim();
const [major = 0, minor = 0, patch = 0] = version.split(".").map(Number);
const isSupported = major > 11 || (major === 11 && (minor > 5 || (minor === 5 && patch >= 1)));

if (!isSupported) {
  console.error(`npm ${version} is below the required 11.5.1 baseline.`);
  process.exit(1);
}

console.log(`Using npm ${version}`);
