let currentConfig = {
    title: 'Visionneuse',
    subtitle: '',
    chemin: ''
};

const modal = document.getElementById('configModal');
const configTitleInput = document.getElementById('configTitle');
const configSubtitleInput = document.getElementById('configSubtitle');
const configPathInput = document.getElementById('configPath');
const selectFolderButton = document.getElementById('selectFolder');
const saveConfigButton = document.getElementById('saveConfig');
const cancelConfigButton = document.getElementById('cancelConfig');
const closeConfigButton = document.getElementById('closeConfig');

function openConfigModal() {
    modal.classList.remove('hidden');
    configTitleInput.value = currentConfig.title || '';
    configSubtitleInput.value = currentConfig.subtitle || '';
    configPathInput.value = currentConfig.chemin || '';
    configTitleInput.focus();
}

function closeConfigModal() {
    modal.classList.add('hidden');
}

async function loadConfig() {
    const config = await window.api.getConfig();
    currentConfig = {
        title: config.title || 'Visionneuse',
        subtitle: config.subtitle || '',
        chemin: config.chemin || ''
    };

    const title = document.getElementById('title');

    if (currentConfig.subtitle) {
        title.textContent = currentConfig.title;

        function changeTitle() {
            title.classList.add('fade-out');
            setTimeout(() => {
                title.textContent =
                    title.textContent === currentConfig.title
                        ? currentConfig.subtitle
                        : currentConfig.title;
                title.classList.remove('fade-out');
            }, 1000);

            setTimeout(changeTitle, 3000);
        }

        changeTitle();
    } else {
        title.textContent = currentConfig.title;
    }
}

async function refreshImages() {
    const images = await window.api.getImages();

    const top = document.getElementById('topRow');
    const bottom = document.getElementById('bottomRow');

    top.innerHTML = '';
    bottom.innerHTML = '';

    if (images.length === 0) {
        const empty = document.createElement('p');
        empty.textContent = 'Aucune image trouvée. Ouvrez la configuration avec Ctrl+Shift+C.';
        empty.style.opacity = '0.7';
        empty.style.margin = '0 auto';
        empty.style.fontSize = '1.1rem';
        document.body.appendChild(empty);
        return;
    }

    const existingEmpty = document.querySelector('body > p');
    if (existingEmpty) {
        existingEmpty.remove();
    }

    function zoomImage(image) {
        const rect = image.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        const zoomedImg = new Image();
        zoomedImg.src = image.src;
        zoomedImg.classList.add('zoomed-image');

        const zoomedImgContainer = document.createElement('div');
        zoomedImgContainer.classList.add('zoomed-image-container');

        zoomedImgContainer.appendChild(zoomedImg);
        document.body.appendChild(zoomedImgContainer);

        zoomedImg.style.position = 'absolute';
        const zoomedImgTop = rect.top + window.scrollY;
        const zoomedImgLeft = rect.left + window.scrollX;
        zoomedImg.style.top = `${zoomedImgTop}px`;
        zoomedImg.style.left = `${zoomedImgLeft}px`;
        zoomedImg.style.width = `${width}px`;
        zoomedImg.style.height = `${height}px`;

        setTimeout(() => {
            const translateX = (window.innerWidth - width) / 2 - zoomedImgLeft;
            const translateY = (window.innerHeight - height) / 2 - zoomedImgTop;
            zoomedImg.style.transition = 'transform 0.3s ease-in-out';
            zoomedImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(1.8)`;
        }, 10);

        zoomedImgContainer.addEventListener('click', () => {
            zoomedImg.style.transition = 'transform 0.3s ease-in-out';
            zoomedImg.style.transform = 'scale(1)';
            setTimeout(() => {
                document.body.removeChild(zoomedImgContainer);
            }, 300);
        });
    }

    images.forEach((image, index) => {
        const img = document.createElement('img');
        img.className = 'photo';
        img.src = 'file:///' + image.path.replace(/\\/g, '/');

        img.addEventListener('click', () => {
            zoomImage(img);
        });

        if (index < 2) {
            top.appendChild(img);
        } else {
            bottom.appendChild(img);
        }
    });
}

async function saveConfig() {
    const config = {
        titre: configTitleInput.value.trim() || 'Visionneuse',
        titre2: configSubtitleInput.value.trim(),
        chemin: configPathInput.value.trim()
    };

    currentConfig = await window.api.saveConfig(config);
    await loadConfig();
    await refreshImages();
    closeConfigModal();
}

async function chooseFolder() {
    const folderPath = await window.api.selectFolder();
    if (folderPath) {
        configPathInput.value = folderPath;
    }
}

selectFolderButton.addEventListener('click', chooseFolder);
saveConfigButton.addEventListener('click', saveConfig);
cancelConfigButton.addEventListener('click', closeConfigModal);
closeConfigButton.addEventListener('click', closeConfigModal);
modal.addEventListener('click', event => {
    if (event.target === modal) {
        closeConfigModal();
    }
});

window.addEventListener('keydown', event => {
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyC') {
        event.preventDefault();
        openConfigModal();
    }
});

window.api.onImagesUpdated(() => {
    refreshImages();
});

(async () => {
    await loadConfig();
    await refreshImages();
})();