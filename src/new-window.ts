import { promisifyExec } from "./utils/promisifyExec";
import { getEdgePath } from "./utils/edgePaths";

export interface NewWindowOptions {
  url?: string;
  incognito?: boolean;
  windowPosition?: { x: number; y: number };
  windowSize?: { width: number; height: number };
  additionalSwitches?: string[];
  profilePath?: string; // New option for profile support
}

/**
 * Opens a new Microsoft Edge window
 * @param options Configuration options for the new window
 * @returns Promise that resolves when the window is launched
 */
export const openNewEdgeWindow = async (options: NewWindowOptions = {}) => {
  const edgePath = getEdgePath();

  const switches: string[] = [];

  // Add profile path if specified (and not Default)
  if (options.profilePath && options.profilePath !== "Default") {
    switches.push(`--profile-directory="${options.profilePath}"`);
  }

  // Add URL if provided (not a switch, just the URL argument)
  const urlArg = options.url ? `"${options.url}"` : null;

  // Add incognito mode if requested
  if (options.incognito) {
    switches.push("--incognito");
  }

  // Force new window
  switches.push("--new-window");

  // Add any additional switches
  if (options.additionalSwitches) {
    switches.push(...options.additionalSwitches);
  }

  // Build command arguments (URL first if provided, then switches)
  const args: string[] = [];
  if (urlArg) {
    args.push(urlArg);
  }
  args.push(...switches);

  const command = `${edgePath} ${args.join(" ")}`;

  console.log("🚀 ~ new-window.ts:57 ~ openNewEdgeWindow ~ command:", command);

  try {
    const { stdout, stderr } = await promisifyExec(command);

    if (stderr) {
      console.error("Error opening new Edge window:", stderr);
      throw new Error(`Failed to open Edge window: ${stderr}`);
    }

    if (stdout) {
      console.log("New Edge window opened successfully:", stdout);
    }

    return { success: true, stdout, stderr };
  } catch (error) {
    console.error("Failed to execute Edge command:", error);
    throw error;
  }
};

/**
 * Opens a new regular Edge window
 */
export const openNewWindow = () => openNewEdgeWindow();

/**
 * Opens a new incognito Edge window
 */
export const openIncognitoWindow = (profilePath?: string) => openNewEdgeWindow({ incognito: true, profilePath });

/**
 * Opens a new Edge window with a specific URL
 * @param url The URL to open in the new window
 * @param profilePath Optional profile to use
 */
export const openWindowWithUrl = (url: string, profilePath?: string) => openNewEdgeWindow({ url, profilePath });

/**
 * Opens a new Edge window for a specific profile
 * @param profilePath The profile directory name (e.g., "Default", "Profile 2")
 */
export const openWindowWithProfile = (profilePath: string) => openNewEdgeWindow({ profilePath });

/**
 * Opens a new Edge window with custom positioning and size
 * @param x X position of the window
 * @param y Y position of the window
 * @param width Width of the window
 * @param height Height of the window
 * @param profilePath Optional profile to use
 */
export const openWindowWithGeometry = (x: number, y: number, width: number, height: number, profilePath?: string) =>
  openNewEdgeWindow({
    windowPosition: { x, y },
    windowSize: { width, height },
    profilePath,
  });

/**
 * Opens a new Edge window with custom command line switches
 * @param switches Array of command line switches to apply
 * @param options Additional window options
 */
export const openWindowWithSwitches = (
  switches: string[],
  options: Omit<NewWindowOptions, "additionalSwitches"> = {},
) =>
  openNewEdgeWindow({
    ...options,
    additionalSwitches: switches,
  });

/**
 * Opens a new Edge window in kiosk mode (fullscreen without browser UI)
 * @param url Optional URL to open
 */
export const openKioskWindow = (url?: string) =>
  openNewEdgeWindow({
    url,
    additionalSwitches: ["--kiosk"],
  });

/**
 * Opens a new Edge window in app mode (minimal browser UI)
 * @param url The URL to open as an app
 */
export const openAppWindow = (url: string) => {
  const jsCode = `window.moveTo(580,240);window.resizeTo(800,600);window.location='${url}';`;
  const dataUrl = `data:text/html,<html><body><script>${jsCode}</script></body></html>`;

  return openNewEdgeWindow({
    additionalSwitches: [`--app=${dataUrl}`],
  });
};

/**
 * Opens a new Edge window with developer tools enabled
 * @param options Additional window options
 */
export const openDevWindow = (options: NewWindowOptions = {}) =>
  openNewEdgeWindow({
    ...options,
    additionalSwitches: ["--auto-open-devtools-for-tabs"],
  });

export { default } from "./new-window-form";
