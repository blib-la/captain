// Cache for apps that are opened
import type { BrowserWindow } from "electron";

export const apps: Record<string, BrowserWindow | null> = {};
