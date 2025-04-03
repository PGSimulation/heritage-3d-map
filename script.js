// --- Imports ---
// Adjust paths if your three.module.js is elsewhere
import * as THREE from './lib/three/three.module.js';
import { OrbitControls } from './lib/three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from './lib/three/examples/jsm/loaders/GLTFLoader.js';
// Optional: Import GUI if you placed the file
import { GUI } from './lib/three/examples/jsm/libs/lil-gui.module.min.js';
// Optional: Import RGBELoader if you have HDRs and placed the file
// import { RGBELoader } from './lib/three/examples/jsm/loaders/RGBELoader.js';


// --- Global Variables ---
let scene, camera, renderer, controls, loader, gui;
let currentModel = null; // To keep track of the loaded model
const modelPaths = [ // List your models here
    './models/Kaplica_Zychlinskich.glb',
    './models/heritage_scan2.glb'
];
let currentModelIndex = 0; // Start with the first model


// --- DOM Elements ---
const viewerContainer = document.getElementById('viewer-container');
const loadingIndicator = document.getElementById('loading-indicator');
const guiContainer = document.getElementById('gui-container'); // For lil-gui


// --- Initialization ---
function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x404040); // Grey background
    // scene.fog = new THREE.Fog(0x404040, 10, 50); // Optional fog

    // Camera
    camera = new THREE.PerspectiveCamera(50, viewerContainer.clientWidth / viewerContainer.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 5); // Adjust starting position based on model scale

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(viewerContainer.clientWidth, viewerContainer.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // For better visuals with HDRIs
    renderer.toneMappingExposure = 1.0;
    // renderer.shadowMap.enabled = true; // Enable shadows if needed
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    viewerContainer.appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 1, 0); // Adjust target based on typical model center
    controls.update();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Softer ambient
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(3, 10, 5);
    // directionalLight.castShadow = true; // Enable shadows on this light if needed
    scene.add(directionalLight);
    // Optional: Add hemisphere light for softer fill
    // const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d, 1.5 );
	// hemiLight.position.set( 0, 20, 0 );
	// scene.add( hemiLight );


    // Loader
    loader = new GLTFLoader();

    // Optional: Setup Environment Map (Requires an HDR file)
    /*
    const rgbeLoader = new RGBELoader();
    rgbeLoader.setPath('./path/to/your/hdrs/') // << UPDATE PATH
              .load('your_environment.hdr', function ( texture ) { // << UPDATE FILENAME
        texture.mapping = THREE.EquirectangularReflectionMapping;
        // scene.background = texture; // Set as background
        scene.environment = texture; // Set as environment map for reflections
        console.log("Environment map loaded.");
    });
    */

    // Setup GUI (Optional)
    setupGUI();

    // Load the initial model
    loadModel(modelPaths[currentModelIndex]);

    // Setup Resize Listener
    window.addEventListener('resize', onWindowResize);

    // Start Animation Loop
    animate();

    // Placeholder for Leaflet Map Initialization
    // setupMap();
}

// --- Load Model ---
function loadModel(path) {
    if (!path) {
        console.error("No model path provided.");
        return;
    }
    console.log(`Loading model: ${path}`);
    loadingIndicator.style.display = 'block';

    // Remove previous model if exists
    if (currentModel) {
        scene.remove(currentModel);
        // Dispose of geometry/materials if memory becomes an issue
    }

    loader.load(
        path,
        // Success callback
        (gltf) => {
            currentModel = gltf.scene;

            // Optional: Auto-center and scale model
            const box = new THREE.Box3().setFromObject(currentModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 4.0 / maxDim; // Adjust scale factor (e.g., 4 units wide)

            currentModel.scale.setScalar(scale);
            box.setFromObject(currentModel); // Recalculate box after scaling
            box.getCenter(center); // Recalculate center

            currentModel.position.sub(center); // Move model center to origin

            // Optional: Enable shadows for all meshes in the model
            /*
            currentModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            */

            scene.add(currentModel);
            loadingIndicator.style.display = 'none';
            console.log("Model loaded successfully.");
            // Adjust camera target after loading
             controls.target.copy(currentModel.position); // Look at model center (which is now 0,0,0)
             controls.update();
        },
        // Progress callback (optional)
        (xhr) => {
            const percentLoaded = Math.round((xhr.loaded / xhr.total) * 100);
            loadingIndicator.textContent = `Loading: ${percentLoaded}%`;
            // console.log(`Model ${percentLoaded}% loaded`);
        },
        // Error callback
        (error) => {
            console.error('Error loading model:', error);
            loadingIndicator.textContent = 'Error loading model!';
            // Keep indicator visible on error, or hide after a delay
        }
    );
}

// --- GUI Setup (Optional) ---
function setupGUI() {
    // Ensure the GUI library is imported and available
    if (typeof GUI === 'undefined') return;

    gui = new GUI({ container: guiContainer }); // Place GUI in its container

    const params = {
        // Add parameters to control via GUI
        model: modelPaths[currentModelIndex], // Show current model path
        nextModel: () => {
             currentModelIndex = (currentModelIndex + 1) % modelPaths.length;
             params.model = modelPaths[currentModelIndex]; // Update display
             loadModel(params.model);
             gui.updateDisplay(); // Refresh GUI to show new path
        },
        previousModel: () => {
             currentModelIndex = (currentModelIndex - 1 + modelPaths.length) % modelPaths.length;
             params.model = modelPaths[currentModelIndex]; // Update display
             loadModel(params.model);
             gui.updateDisplay(); // Refresh GUI
        }
    };

    const modelFolder = gui.addFolder('Model Selection');
    // Display current model (read-only)
    modelFolder.add(params, 'model').name('Current Model').disable();
    modelFolder.add(params, 'previousModel').name('Previous Model');
    modelFolder.add(params, 'nextModel').name('Next Model');

    // Add more folders and controls (e.g., for lighting, materials) here
    // const lightFolder = gui.addFolder('Lighting');
    // lightFolder.add(directionalLight, 'intensity', 0, 5);
    // ... etc
}

// --- Resize Handler ---
function onWindowResize() {
    camera.aspect = viewerContainer.clientWidth / viewerContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewerContainer.clientWidth, viewerContainer.clientHeight);
}

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Required if damping is enabled
    renderer.render(scene, camera);
}

// --- Leaflet Map Setup (Placeholder) ---
/*
function setupMap() {
    // Check if Leaflet library is loaded
    if (typeof L === 'undefined') {
        console.warn("Leaflet library not found. Skipping map setup.");
        return;
    }
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) {
         console.warn("Map container div not found. Skipping map setup.");
         return;
    }

    // Initialize Leaflet map here...
    // const map = L.map(mapContainer).setView([latitude, longitude], zoom);
    // L.tileLayer(...).addTo(map);
    // ... add markers, interactions etc. ...
    console.log("Leaflet map setup placeholder executed.");
}
*/


// --- Start ---
init();