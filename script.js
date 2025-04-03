// Model data (bez hardcoded koordynatów)
const models = [
    { name: "Heritage Scan 1", path: "models/heritage_scan1.glb", tags: ["photogrammetry", "heritage"], category: "Cultural Heritage", license: "CC BY" },
    { name: "Heritage Scan 2", path: "models/heritage_scan2.glb", tags: ["architecture"], category: "Architecture", license: "Public Domain" }
  ];
  
  // --- Leaflet Map Setup ---
  const map = L.map('map').setView([0, 0], 2); // Domyślny widok na środek świata
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
  
  const markers = {}; // Przechowuje markery dla każdego modelu
  let currentMarker = null; // Aktualnie wybrany marker
  
  // Ustawianie/edycja koordynatów przez kliknięcie na mapę
  map.on('click', (e) => {
    if (currentMarker) {
      currentMarker.setLatLng(e.latlng);
      updateCoordinates(e.latlng.lat, e.latlng.lng);
    } else {
      const selectedModel = models.find(m => m.path === document.getElementById('modelLink').href.split('model=')[1]) || 
                           Object.values(markers).find(m => m.path === document.getElementById('modelLink').href.split('model=')[1]);
      if (selectedModel) {
        currentMarker = L.marker(e.latlng, { draggable: true }).addTo(map);
        currentMarker.bindPopup(selectedModel.name);
        currentMarker.on('dragend', () => {
          const latlng = currentMarker.getLatLng();
          updateCoordinates(latlng.lat, latlng.lng);
        });
        currentMarker.on('click', () => loadModel(selectedModel));
        markers[selectedModel.path] = currentMarker;
        updateCoordinates(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  
  // --- Three.js Setup ---
  let scene, camera, renderer, model, controls;
  function initThreeJS() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / 2 / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth / 2, window.innerHeight);
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
  
      // Auto-scale
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 5 / maxDim;
      model.scale.set(scale, scale, scale);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center.multiplyScalar(scale));
  
      // Update properties
      document.getElementById('modelName').value = modelData.name;
      document.getElementById('tags').value = modelData.tags.join(', ');
      document.getElementById('category').value = modelData.category;
      document.getElementById('license').value = modelData.license;
      
      // Koordynaty (domyślnie puste, jeśli nie ustawione)
      const marker = markers[modelData.path];
      if (marker) {
        const latlng = marker.getLatLng();
        document.getElementById('lat').value = latlng.lat;
        document.getElementById('lon').value = latlng.lng;
        currentMarker = marker;
      } else {
        document.getElementById('lat').value = '';
        document.getElementById('lon').value = '';
        currentMarker = null;
      }
  
      // Tris and vertex count
      let tris = 0, vertices = 0;
      model.traverse(obj => {
        if (obj.isMesh) {
          tris += obj.geometry.index ? obj.geometry.index.count / 3 : obj.geometry.attributes.position.count / 3;
          vertices += obj.geometry.attributes.position.count;
        }
      });
      document.getElementById('trisCount').textContent = tris;
      document.getElementById('vertexCount').textContent = vertices;
  
      // Model link
      const link = `${window.location.origin}/?model=${encodeURIComponent(modelData.path)}`;
      const linkElement = document.getElementById('modelLink');
      linkElement.href = link;
      linkElement.textContent = link;
  
      // Download button
      document.getElementById('downloadBtn').onclick = () => {
        const a = document.createElement('a');
        a.href = modelData.path;
        a.download = `${modelData.name}.glb`;
        a.click();
      };
  
      controls.reset();
    });
  }
  
  function handleUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const modelData = { name: file.name, path: url, tags: [], category: "Cultural Heritage", license: "CC BY" };
      loadModel(modelData);
      // Nie tworzymy markera od razu – użytkownik ustawi koordynaty kliknięciem
    }
  }
  
  function updateCoordinates(lat, lon) {
    document.getElementById('lat').value = lat.toFixed(4);
    document.getElementById('lon').value = lon.toFixed(4);
  }
  
  // Manualna edycja koordynatów w polach tekstowych
  document.getElementById('lat').addEventListener('change', (e) => {
    if (currentMarker) {
      const lat = parseFloat(e.target.value);
      const lon = parseFloat(document.getElementById('lon').value);
      currentMarker.setLatLng([lat, lon]);
    }
  });
  document.getElementById('lon').addEventListener('change', (e) => {
    if (currentMarker) {
      const lat = parseFloat(document.getElementById('lat').value);
      const...
  
  Something went wrong, please try again.