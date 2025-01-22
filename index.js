const express = require('express');
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const port = 3000;

// Création du serveur HTTP
const server = http.createServer(app);
const io = socketIO(server);


// Middleware pour servir les fichiers statiques (css/script/config)
app.use(express.static('public'));

// Répertoire à surveiller
let directoryToWatch = '';
// Titre du site
let siteTitle = '';
// texte supplémentaire
let supText = null;

const getConfig = () => {
  return new Promise((resolve, reject) => {
    fs.readFile('config.txt', 'utf8', (err, data) => {
      if (err) {
        console.error('Erreur lors de la lecture du fichier de configuration :', err);
        reject(err);
        return;
      }
    
      try {
        // Analyser le contenu JSON du fichier de configuration
        const config = JSON.parse(data);
    
        // Récupérer les informations du fichier de configuration
        directoryToWatch = config.chemin;
        siteTitle = config.titre;
        supText = config.titre2 && config.titre2;

        // Middleware pour servir les fichiers statiques (images)
        app.use(express.static(directoryToWatch));

        // Surveillance des modifications dans le dossier
        const watcher = chokidar.watch(directoryToWatch);
        watcher.on('add', () => {
          // console.log('Un nouveau fichier a été ajouté');
          io.emit('update');
        });
        watcher.on('unlink', (filePath) => {
          // console.log(`Le fichier ${filePath} a été supprimé`);
          io.emit('update');
        });

        resolve({directoryToWatch:directoryToWatch,siteTitle:siteTitle});
    
      } catch (parseErr) {
        reject(parseErr);
        console.error('Erreur lors de l\'analyse du fichier de configuration JSON :', parseErr);
      }
    });
  });
}

// Fonction pour obtenir les 4 fichiers les plus récents du dossier
const getRecentImages = () => {
  return new Promise((resolve, reject) => {
    fs.readdir(directoryToWatch, (err, files) => {
      if (err) {
        reject(err);
        return;
      }

      // Filtrer les fichiers pour ne prendre que les images (par extension)
      const imageFiles = files.filter(file => {
        const extension = path.extname(file).toLowerCase();
        return extension === '.jpg' || extension === '.jpeg' || extension === '.png' || extension === '.gif';
      });

      // Trier les fichiers par date de modification
      imageFiles.sort((a, b) => {
        const statA = fs.statSync(path.join(directoryToWatch, a));
        const statB = fs.statSync(path.join(directoryToWatch, b));
        return statB.mtime.getTime() - statA.mtime.getTime();
      });

      // Récupérer les 4 fichiers les plus récents
      const recentImages = imageFiles.slice(0, 4);

      resolve(recentImages);
    });
  });
};

// Route pour afficher les 4 images les plus récentes
app.get('/', async (req, res) => {
  try {

    const config = await getConfig();
    
    const recentImages = await getRecentImages();

    // Générer le code HTML pour afficher les images
    const imageElements = recentImages.map(image => `<img src="${image}" class="img" alt="Image">`);

    // Répondre avec la page HTML contenant les images
    const html = `
      <html>
        <head>
          <title>STUDIO PHOTO MUSICOGRAPH</title>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.3.2/socket.io.js"></script>
          <link rel="stylesheet" href="./index.css">
        </head>
        <body class="bodyStyle">
          <div class="container" style="margin-top:20px">
            <div class="imgContainer">${imageElements[0]}</div>
            <div class="imgContainer">${imageElements[1]}</div>
          </div>
          ${supText ? `
            <h1 class="animated-text" data-texts='["${siteTitle}", "${supText}"]'>${siteTitle}</h1>
          ` : `
            <h1 class="title">${siteTitle}</h1>
          `}
          <div class="container" style="margin-bottom:20px">
            <div class="imgContainer">${imageElements[2]}</div>
            <div class="imgContainer">${imageElements[3]}</div>
          </div>
          <script src="./script.js"></script>
        </body>
      </html>
    `;
    res.send(html);
  } catch (err) {
    console.error('Erreur lors de la récupération des images :', err);
    res.status(500).send('Une erreur est survenue');
  }
});

// Démarrer le serveur HTTP
server.listen(port, () => {
  console.log(`Serveur démarré : http://localhost:${port}`);
});