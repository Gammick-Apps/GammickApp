const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('expose', {
    send: (channel, data) => {
        ipcRenderer.send(channel, data);
    },
    receive: (channel, func) => {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
});




