document.addEventListener('DOMContentLoaded', function () {
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');

    console.log("Checking PlayCanvas & Model Viewer...");
    console.log("PlayCanvas:", window.pc);
    console.log("ModelViewer:", pc?.ModelViewer);

    if (!window.pc || !pc.ModelViewer) {
        loadingText.textContent = 'Error: Model Viewer failed to load';
        console.error('PlayCanvas or ModelViewer not available');
        loadingOverlay.style.display = 'none'; // Hide the overlay on failure
        return;
    }

    console.log("This will run before the viewer is initialized");
    try {
        loadingText.textContent = 'Initializing viewer...';

        const viewer = new pc.ModelViewer(document.getElementById('model-viewer'), {
            assetsPrefix: './models/',
            orbitSensitivity: 1.0,
            enableUi: true
        });

        viewer.on('load', () => {
            console.log('Model loaded successfully!');
        });

        viewer.load('./models/Kaplica_Zychlinskich.glb')
            .then(() => {
                // Check if the model loaded successfully
                if (viewer.model) {
                    loadingOverlay.style.display = 'none'; // Hide the overlay on success

                    viewer.camera.orbitYaw = -30;
                    viewer.camera.orbitPitch = 75;
                    viewer.camera.distance = 10;

                    // Example: Add an event listener for a click on the model
                    viewer.scene.on('click', (event) => {
                        console.log('Model clicked!', event);
                    });
                } else {
                    loadingText.textContent = 'Error: Model loaded, but some assets failed to load.';
                    console.error('Model loaded, but some assets failed to load.');
                    loadingOverlay.style.display = 'none';
                }
            })
            .catch(err => {
                loadingText.textContent = 'Error loading 3D model';
                console.error('Model load error:', err);
                loadingOverlay.style.display = 'none'; // Hide the overlay on failure

                // Display a more user-friendly error message
                const errorDiv = document.createElement('div');
                errorDiv.textContent = 'Oops! Something went wrong loading the model.';
                errorDiv.style.color = 'red'; // Make the error message stand out
                document.body.appendChild(errorDiv);
            });

    } catch (error) {
        loadingText.textContent = 'Error initializing viewer';
        console.error('Viewer initialization error:', error);
        loadingOverlay.style.display = 'none'; // Hide the overlay on failure
    }
    console.log("This will run after the viewer is initialized, or if an error occurs");
});
