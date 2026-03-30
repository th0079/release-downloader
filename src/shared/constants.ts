export const ipcChannels = {
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
