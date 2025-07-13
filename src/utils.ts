import { showToast, Toast } from "@raycast/api";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { promisify } from "util";

export const execAsync = promisify(require('child_process').exec);

export interface ProjjCacheItem {
  name: string;
  path: string;
  url?: string;
}

export type ProjjCache = ProjjCacheItem[];

export interface ProjjConfig {
  base: string[];
  alias: Record<string, string>;
  hooks: Record<string, string>;
}

export function checkProjjConfig(): boolean {
  const configPath = join(homedir(), ".projj", "config.json");
  return existsSync(configPath);
}

export function loadProjjConfig(): ProjjConfig | null {
  try {
    const configPath = join(homedir(), ".projj", "config.json");
    const configContent = readFileSync(configPath, "utf-8");
    return JSON.parse(configContent);
  } catch {
    return null;
  }
}

export async function checkProjjInstallation(): Promise<{ installed: boolean; path?: string; error?: string }> {
  const shell = process.env.SHELL || '/bin/zsh';

  try {
    const result = await execAsync(`${shell} -i -c "which projj"`);
    const projjPath = result.stdout.trim();

    if (projjPath && existsSync(projjPath)) {
      return { installed: true, path: projjPath };
    }
  } catch {}

  return {
    installed: false,
    error: "projj not found. Please install projj using 'npm install -g projj'"
  };
}

export function loadProjjCache(): ProjjCache | null {
  try {
    const cachePath = join(homedir(), ".projj", "cache.json");
    if (!existsSync(cachePath)) {
      return null;
    }
    const cacheContent = readFileSync(cachePath, "utf-8");
    const cache = JSON.parse(cacheContent);

    if (Array.isArray(cache)) {
      return cache;
    }

    if (typeof cache === "object" && cache !== null) {
      const result = Object.entries(cache)
        .filter(([key]) => key !== "version" && key !== "meta" && key !== "config")
        .map(([key, value]: [string, any]) => {
          let projectPath: string;
          let projectUrl: string | undefined;

          if (typeof value === "string") {
            projectPath = value;
          } else if (typeof value === "object" && value !== null) {
            projectPath = value.path || value.dir || value.directory || "";
            projectUrl = value.url || value.repo || value.repository;
          } else {
            projectPath = String(value || "");
          }

          return {
            name: key,
            path: projectPath,
            url: projectUrl,
          };
        });

      return result;
    }

    return [];
  } catch (error) {
    return null;
  }
}

export async function openWithCursor(projectPath: string, projectName?: string): Promise<void> {
  try {
    const shell = process.env.SHELL || '/bin/zsh';
    await execAsync(`${shell} -i -c "code '${projectPath}'"`);
    await showToast(Toast.Style.Success, "Opened with Cursor", projectName || "");
  } catch (error) {
    await showToast(Toast.Style.Failure, "Failed to open with Cursor", "Make sure Cursor is installed");
  }
}

export async function openInTerminal(projectPath: string, projectName?: string): Promise<void> {
  try {
    await execAsync(`open -a Warp "${projectPath}"`);
    await showToast(Toast.Style.Success, "Opened in Warp", projectName || "");
  } catch (error) {
    await showToast(Toast.Style.Failure, "Failed to open in Warp", "Make sure Warp is installed");
  }
}

export function getProjectName(projectPath: string, projectName?: string): string {
  if (projectPath) {
    return projectPath.split('/').pop() || 'Unknown';
  }
  return projectName ? projectName.split('/').pop() || projectName : 'Unknown';
}

export function getOwnerName(projectUrl?: string, projectPath?: string): string {
  let ownerName = '';

  if (projectUrl) {
    const gitMatch = projectUrl.match(/[:/]([^/]+)\/[^/]+(?:\.git)?$/);
    if (gitMatch) {
      ownerName = gitMatch[1];
    }
  }

  if (!ownerName && projectPath) {
    const pathParts = projectPath.split('/');
    const githubIndex = pathParts.findIndex(part => part === 'github.com');
    if (githubIndex !== -1 && githubIndex + 1 < pathParts.length) {
      ownerName = pathParts[githubIndex + 1];
    }
  }

  return ownerName;
}

export function getDefaultShell(): string {
  return process.env.SHELL || '/bin/zsh';
}