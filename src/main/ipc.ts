import { BrowserWindow, dialog, ipcMain, shell } from "electron";

import { ipcChannels } from "../shared/constants.js";
import type {
  ApiResult,
  DownloadAssetInput,
  DownloadProgressEvent,
  RepositoryLookupInput,
  RepositorySuggestion,
  SettingsState
} from "../shared/types.js";
import { cancelDownload, downloadAsset } from "./services/downloadService.js";
import { lookupRepositoryWithReleases, searchRepositorySuggestions } from "./services/githubService.js";
import {
  clearGithubToken,
  loadSettings,
  rememberRepository,
  saveGithubToken,
  saveLastDownloadDirectory
} from "./services/settingsService.js";

function success<T>(data: T): ApiResult<T> { return { ok: true, data }; }
function failure(message: string): ApiResult<never> { return { ok: false, error: { code: "UNKNOWN_ERROR", message } }; }

export function registerIpc(getMainWindow: () => BrowserWindow | null): void {
  ipcMain.handle(ipcChannels.getSettings, async () => success<SettingsState>(await loadSettings()));

  ipcMain.handle(ipcChannels.saveGithubToken, async (_event, token: string) => {
    if (typeof token !== "string" || token.trim().length === 0) return failure("Enter a GitHub token first.");
    return success(await saveGithubToken(token));
  });

  ipcMain.handle(ipcChannels.clearGithubToken, async () => success(await clearGithubToken()));

  ipcMain.handle(ipcChannels.chooseDirectory, async () => {
    const window = getMainWindow();
    if (!window) return failure("No active window.");
    const result = await dialog.showOpenDialog(window, { properties: ["openDirectory", "createDirectory"], title: "Choose download directory" });
    if (result.canceled || result.filePaths.length === 0) return success<string | null>(null);
    await saveLastDownloadDirectory(result.filePaths[0]);
    return success(result.filePaths[0]);
  });

  ipcMain.handle(ipcChannels.searchRepositories, async (_event, query: string) => {
    const result = await searchRepositorySuggestions(query);
    return result.ok ? success<RepositorySuggestion[]>(result.data) : result;
  });

  ipcMain.handle(ipcChannels.lookupRepository, async (_event, input: RepositoryLookupInput) => {
    const result = await lookupRepositoryWithReleases(input.repository);
    if (result.ok) await rememberRepository(input.repository.trim());
    return result;
  });

  ipcMain.handle(ipcChannels.openExternal, async (_event, url: string) => {
    if (!/^https:\/\/github\.com\//i.test(url)) return failure("Only GitHub URLs can be opened.");
    await shell.openExternal(url);
    return success(true);
  });

  ipcMain.handle(ipcChannels.revealInFolder, async (_event, targetPath: string) => {
    if (typeof targetPath !== "string" || targetPath.trim().length === 0) return failure("No file path to reveal.");
    shell.showItemInFolder(targetPath);
    return success(true);
  });

  ipcMain.handle(ipcChannels.downloadAsset, async (_event, input: DownloadAssetInput) => {
    const window = getMainWindow();
    if (!window) return failure("No active window.");
    const settings = await loadSettings();
    const targetDirectory = input.directory ?? settings.lastDownloadDirectory;
    if (!targetDirectory) return failure("Choose a download directory first.");

    try {
      await saveLastDownloadDirectory(targetDirectory);
      const job = await downloadAsset(input, targetDirectory, (nextJob) => {
        const payload: DownloadProgressEvent = { job: nextJob };
        window.webContents.send(ipcChannels.downloadProgress, payload);
      });
      return success(job);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Download failed.";
      return { ok: false, error: { code: "DOWNLOAD_FAILED", message } };
    }
  });

  ipcMain.handle(ipcChannels.cancelDownload, async (_event, jobId: string) => success(cancelDownload(jobId)));
}
