const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const { logError, getLogsDir } = require('./logger');

const CONFIG_FILE = path.join(app.getPath('userData'), 'config.json');
const DEFAULT_CONFIG = {
    chemin: '',
    titre: 'Visionneuse',
    titre2: ''
};

let mainWindow;
let watcher;
let directoryToWatch = '';
let siteTitle = '';
let supText = '';

function loadConfig() {
    try {
        let config;

        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            config = JSON.parse(data);
        } else {
            config = { ...DEFAULT_CONFIG };
        }

        directoryToWatch = config.chemin || '';
        siteTitle = config.titre || DEFAULT_CONFIG.titre;
        supText = config.titre2 || '';

        return config;
    } catch (err) {
        logError(
            'loadConfig',
            err.stack || err.message
        );

        throw err;
    }
}

function saveConfig(config) {
    try {
        const normalizedConfig = {
            ...DEFAULT_CONFIG,
            ...config,
            chemin: config.chemin || ''
        };

        fs.writeFileSync(
            CONFIG_FILE,
            JSON.stringify(normalizedConfig, null, 2),
            'utf8'
        );

        directoryToWatch = normalizedConfig.chemin;
        siteTitle = normalizedConfig.titre;
        supText = normalizedConfig.titre2 || '';

        if (watcher) {
            watcher.close();
            watcher = null;
        }

        if (directoryToWatch) {
            watchFolder();
        }

        return normalizedConfig;
    } catch (err) {
        logError(
            'saveConfig',
            err.stack || err.message
        );

        throw err;
    }
}

function getRecentImages() {
    try {
        if (!directoryToWatch || !fs.existsSync(directoryToWatch)) {
            return [];
        }

        const files = fs.readdirSync(directoryToWatch);

        // Filtrer les fichiers pour ne prendre que les images (par extension)
        const imageFiles = files.filter(file => {
            const extension = path.extname(file).toLowerCase();

            return [
                '.jpg',
                '.jpeg',
                '.png',
                '.gif'
            ].includes(extension);
        });

        // Trier les fichiers par date de modification
        imageFiles.sort((a, b) => {
            const statA = fs.statSync(
                path.join(directoryToWatch, a)
            );

            const statB = fs.statSync(
                path.join(directoryToWatch, b)
            );

            return statB.mtimeMs - statA.mtimeMs;
        });

        // Récupérer les 4 fichiers les plus récents
        return imageFiles
            .slice(0, 4)
            .map(file => ({
                name: file,
                path: path.join(directoryToWatch, file)
            }));
    } catch (err) {
        logError(
            'getRecentImages',
            err.stack || err.message
        );

        throw err;
    }
}

function watchFolder() {
    try {
        if (!directoryToWatch || !fs.existsSync(directoryToWatch)) {
            return;
        }

        if (watcher) {
            watcher.close();
            watcher = null;
        }

        watcher = chokidar.watch(directoryToWatch, {
            ignored: /(^|[\/\\])\../,
            ignoreInitial: true
        });

        watcher.on('add', notifyUpdate);
        watcher.on('unlink', notifyUpdate);
    } catch (err) {
        logError(
            'watchFolder',
            err.stack || err.message
        );

        throw err;
    }
}

function notifyUpdate() {
    try {
        if (mainWindow) {
            mainWindow.webContents.send('images-updated');
        }
    } catch (err) {
        logError(
            'notifyUpdate',
            err.stack || err.message
        );

        throw err;
    }
    
}

function createWindow() {
    try {
        mainWindow = new BrowserWindow({
            width: 1920,
            height: 1080,
            fullscreen: true,
            autoHideMenuBar: true,

            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: true,
                nodeIntegration: false
            }
        });

        // Listener pour Ctrl+Shift+L - ouvrir le dossier des logs
        mainWindow.webContents.on('before-input-event', async (event, input) => {
            if (input.control && input.shift && input.key.toLowerCase() === 'l') {
                event.preventDefault();
                try {
                    const logsDir = getLogsDir();
                    if (!fs.existsSync(logsDir)) {
                        fs.mkdirSync(logsDir, { recursive: true });
                    }
                    await shell.openPath(logsDir);
                } catch (err) {
                    logError('openLogs', err.stack || err.message);
                }
            }
        });
    } catch (err) {
        logError(
            'createWindow',
            err.stack || err.message
        );

        throw err;
    }
    
}

function showErrorPage(error) {

    if (!mainWindow) {
        createWindow();
    }

    mainWindow.loadFile(
        'renderer/error.html',
        {
            query: {
                message: error.message
            }
        }
    );
}

process.on('uncaughtException', err => {
    showErrorPage(err);
    logError(
        'uncaughtException',
        err.stack || err.message
    );
});

process.on('unhandledRejection', err => {
    showErrorPage(
        err instanceof Error
            ? err
            : new Error(String(err))
    );
    logError(
        'unhandledRejection',
        err.stack || err.message
    );
});

app.whenReady().then(() => {
    try {
        loadConfig();

        createWindow();

        mainWindow.loadFile('renderer/index.html');

        watchFolder();
    } catch (err) {
        showErrorPage(err);
    }

    // mainWindow.webContents.openDevTools();
});

ipcMain.handle('get-config', () => ({
    title: siteTitle,
    subtitle: supText,
    chemin: directoryToWatch
}));

ipcMain.handle('save-config', (_, config) => {
    return saveConfig(config);
});

ipcMain.handle('select-folder', async () => {
    try {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory']
        });

        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }

        return result.filePaths[0];
    } catch (err) {
        logError(
            'select-folder',
            err.stack || err.message
        );

        return null;
    }
});

ipcMain.handle('get-images', () => {
    return getRecentImages();
});

ipcMain.handle('open-logs', async () => {
    try {
        const logsDir = getLogsDir();
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        await shell.openPath(logsDir);
        return true;
    } catch (err) {
        logError(
            'open-logs',
            err.stack || err.message
        );
        return false;
    }
});

// ipcMain.handle('get-images', () => {
//     try {
//         return getRecentImages();
//     } catch (err) {
//         logError(
//             'get-images',
//             err.stack || err.message
//         );

//         return [];
//     }
// });

app.on('window-all-closed', () => {
    app.quit();
});