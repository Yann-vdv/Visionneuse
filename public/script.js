const socket = io();
socket.on('update', () => {
    location.reload(); // Recharge la page lorsque de nouvelles images sont ajoutées
});

document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('.img');
    
    images.forEach(image => {
        image.addEventListener('click', () => {
            // Récupérer la position et les dimensions de l'image d'origine
            const rect = image.getBoundingClientRect();
            const width = rect.width;  // Largeur de l'image d'origine
            const height = rect.height; // Hauteur de l'image d'origine

            // Créez une copie agrandie de l'image au clic
            const zoomedImg = new Image();
            zoomedImg.src = image.src;
            zoomedImg.classList.add('zoomed-image');

            const zoomedImgContainer = document.createElement('div');
            zoomedImgContainer.classList.add('zoomed-image-container');

            zoomedImgContainer.appendChild(zoomedImg)
            
            // Ajoutez la version agrandie à la page
            document.body.appendChild(zoomedImgContainer);

            // Positionner l'image agrandie à la même position que l'image d'origine
            zoomedImg.style.position = 'absolute'; // Position absolue pour la mettre où on veut
            const zoomedImgTop = rect.top + window.scrollY; // Calcul de la position verticale
            const zoomedImgLeft = rect.left + window.scrollX; // Calcul de la position horizontale
            zoomedImg.style.top = `${zoomedImgTop}px`;
            zoomedImg.style.left = `${zoomedImgLeft}px`;
            zoomedImg.style.width = `${width}px`; // Largeur de l'image d'origine
            zoomedImg.style.height = `${height}px`; // Hauteur de l'image d'origine

            setTimeout(() => {

                const translateX = (window.innerWidth - width)/2 - zoomedImgLeft;
                const translateY = (window.innerHeight - height)/2 - zoomedImgTop;

                zoomedImg.style.transition = 'transform 0.3s ease-in-out'; // Transition d'agrandissement
                zoomedImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(1.8)`; // Zoom à 150%
    
            }, 10);
            
            // Supprimez l'image agrandie lorsqu'elle est cliquée
            zoomedImgContainer.addEventListener('click', () => {
                zoomedImg.style.transition = 'transform 0.3s ease-in-out'; // Transition de réduction
                zoomedImg.style.transform = 'scale(1)'; // Retour au zoom initial
                setTimeout(() => {
                    document.body.removeChild(zoomedImgContainer);
                }, 300)
            });
        });
    });

    const animatedText = document.querySelector('.animated-text');
    const texts = JSON.parse(animatedText.getAttribute('data-texts')); // Retrieve texts from data attribute
    let currentIndex = 0;

    function changeText() {
        // Apply fade-out effect
        animatedText.classList.add('fade-out');

        // Wait for the fade-out animation to complete
        setTimeout(() => {
        // Change the text and fade it back in
        currentIndex = (currentIndex + 1) % texts.length; // Cycle through texts
        animatedText.textContent = texts[currentIndex];
        animatedText.classList.remove('fade-out'); // Remove the fade-out class
        }, 1000); // Duration of the fade-out animation

        // Schedule the next text change
        setTimeout(changeText, 3000); // Change text every 3 seconds
    }

    
    // Start the text change
    changeText();
});