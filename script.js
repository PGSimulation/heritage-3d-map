document.addEventListener('DOMContentLoaded', () => {
  // Initialize the viewer
  const viewer = new pc.ModelViewer(document.getElementById('model-viewer'), {
      assetsPrefix: './models/',
      orbitSensitivity: 1.0,
      enableUi: true
  });

  // Load initial model
  viewer.load('Kaplica_Zychlinskich.glb').then(() => {
      console.log('Model loaded successfully');
      // Set initial camera position
      viewer.camera.orbitYaw = -30;
      viewer.camera.orbitPitch = 75;
      viewer.camera.distance = 10;
  }).catch(err => {
      console.error('Error loading model:', err);
  });

  // Model switching example
  window.loadModel = (modelPath) => {
      viewer.load(modelPath).catch(err => {
          console.error('Error loading model:', err);
      });
  };
});