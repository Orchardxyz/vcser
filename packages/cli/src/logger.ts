import pc from "picocolors";

const BRAND_RGB = "76;29;149";
const ASCII_BANNER_LINES = [
  "__      _______  _____ ______ _____  ",
  "\\ \\    / / ____|/ ____|  ____|  __ \\",
  " \\ \\  / / (___ | |    | |__  | |__) |",
  "  \\ \\/ / \\___ \\| |    |  __| |  _  / ",
  "   \\  /  ____) | |____| |____| | \\ \\",
  "    \\/  |_____/ \\_____|______|_|  \\_\\"
] as const;
const DARK_GRADIENT_RGB = ["196;181;253", "167;139;250", "139;92;246", "124;58;237", BRAND_RGB, "91;33;182"] as const;
const LIGHT_GRADIENT_RGB = [BRAND_RGB, "91;33;182", "109;40;217", "124;58;237", "91;33;182", BRAND_RGB] as const;
const FALLBACK_THEME = "dark";

type TextFormatter = (value: string) => string;
type TerminalTheme = "dark" | "light";

export interface CliPalette {
  brand: TextFormatter;
  cyan: TextFormatter;
  dim: TextFormatter;
  green: TextFormatter;
  red: TextFormatter;
  yellow: TextFormatter;
}

export interface CliLogger {
  palette: CliPalette;
  banner(): void;
  line(message?: string): void;
  error(message: string): void;
  debug(message: string): void;
  inventorySummary(params: {
    sourceLabel: string;
    sourceCount: number;
    targetLabel: string;
    targetCount: number;
    candidateCount: number;
    missingCount: number;
    mismatchCount: number;
  }): void;
  syncSummary(params: {
    selectedCount: number;
    succeededCount: number;
    failedCount: number;
    failures: Array<{
      extensionId: string;
      message: string;
    }>;
  }): void;
}

interface CliLoggerOptions {
  colorEnabled: boolean;
  debugEnabled: boolean;
  theme?: TerminalTheme;
}

function writeStdout(message = ""): void {
  console.log(message);
}

function writeStderr(message: string): void {
  console.error(message);
}

function applyRgb(rgb: string, value: string): string {
  return `\u001B[38;2;${rgb}m${value}\u001B[39m`;
}

function parseColorFgBgTheme(value: string | undefined): TerminalTheme | undefined {
  if (!value) {
    return undefined;
  }

  const segments = value
    .split(";")
    .map((segment) => Number.parseInt(segment, 10))
    .filter((segment) => Number.isFinite(segment));
  const background = segments.at(-1);

  if (background === undefined) {
    return undefined;
  }

  return background <= 6 || background === 8 ? "dark" : "light";
}

function resolveTerminalTheme(explicitTheme?: TerminalTheme): TerminalTheme {
  if (explicitTheme) {
    return explicitTheme;
  }

  const envTheme = process.env.VSCER_THEME;
  if (envTheme === "dark" || envTheme === "light") {
    return envTheme;
  }

  return parseColorFgBgTheme(process.env.COLORFGBG) ?? FALLBACK_THEME;
}

function createPalette(colorEnabled: boolean): CliPalette {
  const passthrough: TextFormatter = (value) => value;

  if (!colorEnabled) {
    return {
      brand: passthrough,
      cyan: passthrough,
      dim: passthrough,
      green: passthrough,
      red: passthrough,
      yellow: passthrough
    };
  }

  return {
    brand: (value) => `\u001B[38;2;${BRAND_RGB}m${value}\u001B[39m`,
    cyan: pc.cyan,
    dim: pc.dim,
    green: pc.green,
    red: pc.red,
    yellow: pc.yellow
  };
}

export class CliLoggerImpl implements CliLogger {
  public readonly palette: CliPalette;

  private readonly colorEnabled: boolean;
  private readonly debugEnabled: boolean;
  private readonly theme: TerminalTheme;

  public constructor(options: CliLoggerOptions) {
    this.colorEnabled = options.colorEnabled;
    this.debugEnabled = options.debugEnabled;
    this.theme = resolveTerminalTheme(options.theme);
    this.palette = createPalette(options.colorEnabled);
  }

  public static writeErrorLine(message: string): void {
    writeStderr(message);
  }

  public banner(): void {
    for (const [index, line] of ASCII_BANNER_LINES.entries()) {
      this.line(this.colorizeBannerLine(line, index));
    }

    this.line(this.palette.dim("local extension sync"));
    this.line();
  }

  public line(message = ""): void {
    writeStdout(message);
  }

  public error(message: string): void {
    writeStderr(message);
  }

  public debug(message: string): void {
    if (!this.debugEnabled) {
      return;
    }

    writeStderr(this.palette.dim(`[debug] ${message}`));
  }

  /**
   * Keep the inventory header compact because it appears between interactive steps.
   */
  public inventorySummary(params: Parameters<CliLogger["inventorySummary"]>[0]): void {
    this.line(`${this.palette.cyan("Source")}: ${params.sourceLabel} (${params.sourceCount})`);
    this.line(`${this.palette.cyan("Target")}: ${params.targetLabel} (${params.targetCount})`);
    this.line(
      `${this.palette.cyan("Candidates")}: ${params.candidateCount} (${params.missingCount} missing, ${params.mismatchCount} version mismatch)`
    );
    this.line();
  }

  /**
   * Print a terse batch summary first, then expand only the failed extension lines.
   */
  public syncSummary(params: Parameters<CliLogger["syncSummary"]>[0]): void {
    this.line(`${this.palette.cyan("Selected")}: ${params.selectedCount}`);
    this.line(`${this.palette.green("Succeeded")}: ${params.succeededCount}`);
    this.line(`${params.failedCount > 0 ? this.palette.red("Failed") : this.palette.cyan("Failed")}: ${params.failedCount}`);

    if (params.failures.length === 0) {
      return;
    }

    this.line();

    for (const failure of params.failures) {
      this.line(`${this.palette.red(failure.extensionId)}: ${failure.message}`);
    }
  }

  /**
   * Apply a gentle per-line tone shift so the banner keeps legibility on both dark and light terminals.
   */
  private colorizeBannerLine(line: string, index: number): string {
    if (!this.colorEnabled) {
      return line;
    }

    const gradient = this.theme === "light" ? LIGHT_GRADIENT_RGB : DARK_GRADIENT_RGB;
    return applyRgb(gradient[index] ?? BRAND_RGB, line);
  }
}

export function createLogger(options: CliLoggerOptions): CliLogger {
  return new CliLoggerImpl(options);
}
