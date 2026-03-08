import * as esbuild from "esbuild";
import path from "path";
import fs from "fs/promises";

const DATA_DIR = path.resolve(process.cwd(), "data/poc");
const SCREENS_DIR = path.join(DATA_DIR, "screens");
const BUILDS_DIR = path.join(DATA_DIR, "builds");

const SHIMS_DIR = path.resolve(process.cwd(), "src/lib/poc/shims");

export async function writeScreenCode(slug: string, code: string): Promise<void> {
  await fs.mkdir(SCREENS_DIR, { recursive: true });
  await fs.writeFile(path.join(SCREENS_DIR, `${slug}.tsx`), code, "utf-8");
}

export async function readScreenCode(slug: string): Promise<string | null> {
  try {
    return await fs.readFile(path.join(SCREENS_DIR, `${slug}.tsx`), "utf-8");
  } catch {
    return null;
  }
}

export interface CompileResult {
  success: boolean;
  errors: string[];
  outputPath?: string;
}

export async function compileScreen(slug: string): Promise<CompileResult> {
  const inputPath = path.join(SCREENS_DIR, `${slug}.tsx`);
  const outputPath = path.join(BUILDS_DIR, `${slug}.js`);

  try {
    await fs.access(inputPath);
  } catch {
    return { success: false, errors: [`File not found: ${slug}.tsx`] };
  }

  await fs.mkdir(BUILDS_DIR, { recursive: true });

  try {
    const result = await esbuild.build({
      entryPoints: [inputPath],
      bundle: true,
      write: true,
      outfile: outputPath,
      format: "iife",
      globalName: "ScreenModule",
      jsx: "automatic",
      alias: {
        "react": path.join(SHIMS_DIR, "react-shim.mjs"),
        "react-dom": path.join(SHIMS_DIR, "react-shim.mjs"),
        "react/jsx-runtime": path.join(SHIMS_DIR, "jsx-runtime-shim.mjs"),
        "react/jsx-dev-runtime": path.join(SHIMS_DIR, "jsx-runtime-shim.mjs"),
        "recharts": path.join(SHIMS_DIR, "recharts-shim.mjs"),
      },
      footer: { js: "globalThis.ScreenModule = ScreenModule;" },
      target: "es2020",
      minify: false,
      sourcemap: false,
      logLevel: "silent",
    });

    const errors = result.errors.map((e) => `${e.text} (line ${e.location?.line})`);
    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, errors: [], outputPath };
  } catch (exc) {
    const msg = exc instanceof Error ? exc.message : String(exc);
    // Extract meaningful error lines
    const lines = msg.split("\n").filter((l) => l.includes("ERROR") || l.includes("error") || l.includes("✘"));
    return { success: false, errors: lines.length > 0 ? lines : [msg] };
  }
}

export async function readBundle(slug: string): Promise<string | null> {
  try {
    return await fs.readFile(path.join(BUILDS_DIR, `${slug}.js`), "utf-8");
  } catch {
    return null;
  }
}
