const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getImages: () =>
    ipcRenderer.invoke('get-images'),

  getConfig: () =>
    ipcRenderer.invoke('get-config'),

  saveConfig: config =>
    ipcRenderer.invoke('save-config', config),

  selectFolder: () =>
    ipcRenderer.invoke('select-folder'),

  openLogs: () =>
    ipcRenderer.invoke('open-logs'),

  onImagesUpdated: callback =>
    ipcRenderer.on(
      'images-updated',
      callback
    )
});