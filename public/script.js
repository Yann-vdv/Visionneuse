const socket = io();
socket.on('update', () => {
    location.reload(); // Recharge la page lorsque de nouvelles images sont ajoutées
});

document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('.img');
    
    images.forEach(image => {
        image.addEventListener('click', () => {
            // Créez une copie agrandie de l'image au clic
            const zoomedImg = new Image();
            zoomedImg.src = image.src;
            zoomedImg.classList.add('zoomed-image');

            const zoomedImgContainer = document.createElement('div');
            zoomedImgContainer.classList.add('zoomed-image-container');

            zoomedImgContainer.appendChild(zoomedImg)
            
            // Ajoutez la version agrandie à la page
            document.body.appendChild(zoomedImgContainer);

            setTimeout(() => {
                zoomedImg.style.transform = 'translate(-50%, -50%) scale(1.3)'; // Zoom à 150%
            }, 10);
            
            // Supprimez l'image agrandie lorsqu'elle est cliquée
            zoomedImgContainer.addEventListener('click', () => {
                zoomedImg.style.transform = 'translate(-50%, -50%) scale(0.8)'; // Retour au zoom initial
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