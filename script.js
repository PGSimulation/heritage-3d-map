import { GLTFLoader } from './lib/three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from './lib/three/examples/jsm/controls/OrbitControls.js';

// --- Three.js Setup ---
let scene, camera, renderer, model, controls;
let currentModel = null;

function initThreeJS() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x333333);
  camera = new THREE.PerspectiveCamera(75, (window.innerWidth - 300) / (window.innerHeight - 50), 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth - 300, window.innerHeight - 50);
  document.getElementById('viewer').appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 1;
  controls.maxDistance = 100;

  camera.position.set(0, 2, 5);
  controls.update();
  animate();
}

function loadModel(modelData) {
  if (model) scene.remove(model);
  const loader = new GLTFLoader();
  loader.load(
    modelData.path,
    (gltf) => {
      model = gltf.scene;
      scene.add(model);

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 5 / maxDim;
      model.scale.set(scale, scale, scale);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center.multiplyScalar(scale));

      updateProperties(modelData);
      controls.target.set(0, 0, 0);
      controls.update();
    },
    undefined,
    (error) => {
      console.error('Error loading model:', error);
      alert('Failed to load model. Check console for details.');
    }
  );
}

function updateProperties(modelData) {
  currentModel = modelData;
  document.getElementById('modelName').value = modelData.name || '';
  document.getElementById('tags').value = modelData.tags ? modelData.tags.join(', ') : '';
  document.getElementById('category').value = modelData.category || 'Cultural Heritage';
  document.getElementById('license').value = modelData.license || 'CC BY';

  let tris = 0, vertices = 0;
  if (model) {
    model.traverse(obj => {
      if (obj.isMesh) {
        tris += obj.geometry.index ? obj.geometry.index.count / 3 : obj.geometry.attributes.position.count / 3;
        vertices += obj.geometry.attributes.position.count;
      }
    });
  }
  document.getElementById('trisCount').textContent = tris;
  document.getElementById('vertexCount').textContent = vertices;

  const coords = modelData.coords || { lat: 'N/A', lon: 'N/A' };
  document.getElementById('lat').textContent = coords.lat;
  document.getElementById('lon').textContent = coords.lon;

  const link = `${window.location.origin}/?model=${encodeURIComponent(modelData.path)}`;
  const linkElement = document.getElement...

Something went wrong, please try again.