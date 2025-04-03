document.addEventListener('DOMContentLoaded', () => {
  // Initialize the model viewer
  const viewer = new pc.ModelViewer(document.getElementById('model-viewer-element'), {
      assetsPrefix: './models/',
      orbitSensitivity: 1.0,
      enableUi: true
  });

  // Load initial model
  viewer.load('Kaplica_Zychlinskich.glb').then(() => {
      console.log('Model loaded!');
      viewer.camera.orbitYaw = -30;
      viewer.camera.orbitPitch = 75;
      viewer.camera.distance = 10;
  });

  // Example: Button to load another model
  const loadModelButton = document.getElementById('load-other-model-button');
  if (loadModelButton) {
      loadModelButton.addEventListener('click', () => {
          viewer.load('heritage_scan2.glb').then(() => {
              console.log('New model loaded!');
          });
      });
  }

  // Error handling
  viewer.on('error', (err) => {
      console.error('Model loading error:', err);
  });
});