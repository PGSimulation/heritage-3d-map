document.addEventListener('DOMContentLoaded', function () {
    const loadingText = document.getElementById('loading-text');

    console.log("Checking PlayCanvas & Model Viewer...");
    console.log("PlayCanvas:", window.pc);
    console.log("ModelViewer:", pc?.ModelViewer);

    if (!window.pc || !pc.ModelViewer) {
        loadingText.textContent = 'Error: Model Viewer failed to load';
        console.error('PlayCanvas or ModelViewer not available');
        return;
    }

    try {
        loadingText.textContent = 'Initializing viewer...';

        const viewer = new pc.ModelViewer(document.getElementById('model-viewer'), {
            assetsPrefix: './models/',
            orbitSensitivity: 1.0,
            enableUi: true
        });

        viewer.load('./models/Kaplica_Zychlinskich.glb')
            .then(() => {
                document.getElementById('loading-overlay').style.display = 'none';

                viewer.camera.orbitYaw = -30;
                viewer.camera.orbitPitch = 75;
                viewer.camera.distance = 10;
            })
            .catch(err => {
                loadingText.textContent = 'Error loading 3D model';
                console.error('Model load error:', err);
            });

    } catch (error) {
        loadingText.textContent = 'Error initializing viewer';
        console.error('Viewer initialization error:', error);
    }
});
