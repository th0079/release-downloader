import { contextBridge, ipcRenderer } from "electron";

const ipcChannels = {
  chooseDirectory: "dialog:choose-directory",
  getSettings: "settings:get",
  saveGithubToken: "settings:save-github-token",
  clearGithubToken: "settings:clear-github-token",
  searchRepositories: "release:search-repositories",
  lookupRepository: "release:lookup-repository",
  openExternal: "shell:open-external",
  revealInFolder: "shell:reveal-in-folder",
  downloadAsset: "download:start",
  cancelDownload: "download:cancel",
  downloadProgress: "download:progress"
} as const;

const api = {
  getSettings() { return ipcRenderer.invoke(ipcChannels.getSettings); },
  chooseDirectory() { return ipcRenderer.invoke(ipcChannels.chooseDirectory); },
  saveGithubToken(token: string) { return ipcRenderer.invoke(ipcChannels.saveGithubToken, token); },
  clearGithubToken() { return ipcRenderer.invoke(ipcChannels.clearGithubToken); },
  searchRepositories(query: string) { return ipcRenderer.invoke(ipcChannels.searchRepositories, query); },
  lookupRepository(input: unknown) { return ipcRenderer.invoke(ipcChannels.lookupRepository, input); },
  openExternal(url: string) { return ipcRenderer.invoke(ipcChannels.openExternal, url); },
  revealInFolder(path: string) { return ipcRenderer.invoke(ipcChannels.revealInFolder, path); },
  downloadAsset(input: unknown) { return ipcRenderer.invoke(ipcChannels.downloadAsset, input); },
  cancelDownload(jobId: string) { return ipcRenderer.invoke(ipcChannels.cancelDownload, jobId); },
  onDownloadProgress(listener: (payload: unknown) => void) {
    const subscription = (_event: Electron.IpcRendererEvent, payload: unknown) => listener(payload);
    ipcRenderer.on(ipcChannels.downloadProgress, subscription);
    return () => { ipcRenderer.removeListener(ipcChannels.downloadProgress, subscription); };
  }
};

contextBridge.exposeInMainWorld("releaseDownloader", api);
contextBridge.exposeInMainWorld("releaseDownloaderReady", true);
