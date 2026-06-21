const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const LOGS_DIR = path.join(app.getPath('userData'), 'logs');

// Créer le dossier logs s'il n'existe pas
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Fonction pour obtenir la date au format YYYY-MM-DD
const getLogFileName = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}.log`;
};

// Fonction pour obtenir l'heure au format HH:MM:SS
const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

// Fonction pour logger une erreur
const logError = (source, errorMessage) => {
  try {
    const logFileName = getLogFileName();
    const logFilePath = path.join(LOGS_DIR, logFileName);
    
    const timestamp = getCurrentTime();
    const logEntry = `[${timestamp}] [${source}] ${errorMessage}\n`;
    
    // Ajouter l'entrée au fichier log
    fs.appendFileSync(logFilePath, logEntry, 'utf8');
  } catch (err) {
    console.error('Erreur lors de l\'écriture dans le fichier log :', err);
  }
};

// Fonction pour obtenir le chemin du dossier logs
const getLogsDir = () => {
  return LOGS_DIR;
};

module.exports = { logError, getLogsDir };
