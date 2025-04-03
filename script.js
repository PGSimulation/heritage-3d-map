// Model data (no hardcoded coordinates)
const models = [
  { name: "Heritage Scan 1", path: "models/Kaplica_Zychlinskich.glb", tags: ["photogrammetry", "heritage"], category: "Cultural Heritage", license: "CC BY" },
  { name: "Heritage Scan 2", path: "models/heritage_scan2.glb", tags: ["architecture"], category: "Architecture", license: "Public Domain" }
];

let currentModel = models[0];
const modelData = {}; // Store dynamic data like coordinates

// --- Three.js Setup ---
let scene, camera, renderer, model, controls;
function initThreeJS() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth - 300, window.innerHeight - 50);
  document.getElementById('viewer').appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  camera.position.set(0, 2, 5);
  animate();
}

function loadModel(modelData) {
  if (model) scene.remove(model);
  const loader = new THREE.GLTFLoader();
  loader.load(modelData.path, (gltf) => {
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
    controls.reset();
  });
}

function updateProperties(modelData) {
  currentModel = modelData;
  document.getElementById('modelName').textContent = modelData.name;
  document.getElementById('tags').value = modelData.tags.join(', ');
  document.getElementById('category').value = modelData.category;
  document.getElementById('license').value = modelData.license;

  let tris = 0, vertices = 0;
  model.traverse(obj => {
    if (obj.isMesh) {
      tris += obj.geometry.index ? obj.geometry.index.count / 3 : obj.geometry.attributes.position.count / 3;
      vertices += obj.geometry.attributes.position.count;
    }
  });
  document.getElementById('trisCount').textContent = tris;
  document.getElementById('vertexCount').textContent = vertices;

  const coords = modelData.coords || { lat: 'N/A', lon: 'N/A' };
  document.getElementById('lat').textContent = coords.lat;
  document.getElementById('lon').textContent = coords.lon;

  const link = `${window.location.origin}/?model=${encodeURIComponent(modelData.path)}`;
  const linkElement = document.getElementById('modelLink');
  linkElement.href = link;
  linkElement.textContent = link;

  document.getElementById('downloadBtn').onclick = () => {
    const a = document.createElement('a');
    a.href = modelData.path;
    a.download = `${modelData.name}.glb`;
    a.click();
  };
}

function handleUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    const newModel = { name: file.name, path: url, tags: [], category: "Cultural Heritage", license: "CC BY" };
    models.push(newModel);
    loadModel(newModel);
  }
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// --- Map Editor ---
const mapModal = document.getElementById('mapModal');
const closeBtn = document.getElementsByClassName('close')[0];
let map, marker;

document.getElementById('editCoords').onclick = () => {
  mapModal.style.display = 'block';
  if (!map) {
    map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
  }

  const coords = currentModel.coords || { lat: 0, lon: 0 };
  if (marker) marker.remove();
  marker = L.marker([coords.lat, coords.lon], { draggable: true }).addTo(map);
  map.setView([coords.lat, coords.lon], 10);

  marker.on('dragend', () => {
    const latlng = marker.getLatLng();
    currentModel.coords = { lat: latlng.lat.toFixed(4), lon: latlng.lng.toFixed(4) };
    updateProperties(currentModel);
  });

  map.on('click', (e) => {
    marker.setLatLng(e.latlng);
    currentModel.coords = { lat: e.latlng.lat.toFixed(4), lon: e.latlng.lng.toFixed(4) };
    updateProperties(currentModel);
  });
};

closeBtn.onclick = () => {
  mapModal.style.display = 'none';
};

// --- Initialize ---
initThreeJS();
loadModel(models[0]);

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = (window.innerWidth - 300) / (window.innerHeight - 50);
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth - 300, window.innerHeight - 50);
});