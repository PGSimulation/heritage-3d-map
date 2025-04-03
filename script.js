// --- Imports ---
// Correct path to the core module based on your information
import * as THREE from './libs/three/build/three.module.js';

// Standard paths to JSM addon modules - Make SURE these files
// are the correct ones from the r175 examples/jsm/ directory!
import { OrbitControls } from './libs/three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from './libs/three/examples/jsm/loaders/GLTFLoader.js';
import { GUI } from './libs/three/examples/jsm/libs/lil-gui.module.min.js';
// Optional: Import RGBELoader if you want environment maps later
// import { RGBELoader } from './libs/three/examples/jsm/loaders/RGBELoader.js';


// --- Global Variables ---
let scene, camera, renderer, controls, loader, gui;
let currentModel = null; // Reference to the currently loaded model group
const modelPaths = [     // Array of model paths relative to index.html
    './models/Kaplica_Zychlinskich.glb',
    './models/heritage_scan2.glb'
    // Add more model paths here if needed
];
let currentModelIndex = 0; // Index for the modelPaths array


// --- DOM Elements ---
const viewerContainer = document.getElementById('viewer-container');
const loadingIndicator = document.getElementById('loading-indicator');
const guiContainer = document.getElementById('gui-container'); // Parent for lil-gui


// --- Initialization Function ---
function init() {
    console.log("Initializing Three.js scene...");

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x454e54); // Slightly bluish dark grey

    // Camera
    const aspect = viewerContainer.clientWidth / viewerContainer.clientHeight;
    camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 2000); // Increased far plane
    camera.position.set(0, 1.5, 6); // Adjust initial camera position as needed
    camera.lookAt(0, 0.5, 0);        // Point camera towards origin/model center

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(viewerContainer.clientWidth, viewerContainer.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    // Enable Physically Correct Lighting
    renderer.physicallyCorrectLights = true; // Deprecated, use renderer.useLegacyLights = false; in newer versions
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputEncoding = THREE.sRGBEncoding; // Use sRGBEncoding for output
    // Optional: Enable shadows
    // renderer.shadowMap.enabled = true;
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    viewerContainer.appendChild(renderer.domElement); // Add canvas to HTML

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.5; // Prevent zooming too close
    controls.maxDistance = 100; // Prevent zooming too far
    controls.target.set(0, 0.5, 0); // Match camera lookAt target initially
    controls.update();

    // Lighting
    // Ambient light provides overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Directional light simulates sunlight
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(5, 10, 7); // Adjust position/angle
    // Optional: Enable shadows for this light
    // directionalLight.castShadow = true;
    // Configure shadow properties if enabled
    // directionalLight.shadow.mapSize.width = 1024;
    // directionalLight.shadow.mapSize.height = 1024;
    // directionalLight.shadow.camera.near = 0.5;
    // directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);

    // Optional: Hemisphere Light for softer skylight/ground reflection effect
    // const hemiLight = new THREE.HemisphereLight( 0xadcce6, 0x404025, 1.0 ); // Sky, ground, intensity
	// scene.add( hemiLight );


    // GLTF Loader
    loader = new GLTFLoader();

    // Setup GUI Controls
    setupGUI();

    // Load the initial model
    loadModel(modelPaths[currentModelIndex]);

    // Event Listeners
    window.addEventListener('resize', onWindowResize);

    // Start the animation loop
    animate();

    console.log("Initialization Complete.");
}

// --- Load Model Function ---
function loadModel(path) {
    if (!path) {
        console.error("LoadModel: No path provided.");
        loadingIndicator.textContent = 'Error: Invalid model path.';
        loadingIndicator.style.display = 'block';
        return;
    }

    console.log(`Loading model from: ${path}`);
    loadingIndicator.textContent = 'Loading Model...';
    loadingIndicator.style.display = 'block'; // Show indicator

    // --- Remove previous model safely ---
    if (currentModel) {
        scene.remove(currentModel);
        // Basic cleanup (more advanced might be needed for complex scenes)
        currentModel.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
         console.log("Previous model removed.");
    }
    // --- --------------------------- ---

    loader.load(
        path,
        // --- onLoad ---
        (gltf) => {
            currentModel = gltf.scene; // Store reference to the loaded model's scene group
            console.log("Model loaded successfully:", currentModel);

            // --- Optional: Auto-center and scale ---
            try {
                const box = new THREE.Box3().setFromObject(currentModel);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());

                // Scale model to fit within a reasonable size (e.g., max dimension of 5 units)
                const maxDim = Math.max(size.x, size.y, size.z);
                const desiredSize = 5.0;
                if (maxDim > 0) { // Avoid division by zero if model is empty
                    const scale = desiredSize / maxDim;
                    currentModel.scale.setScalar(scale);
                     console.log(`Model scaled by: ${scale.toFixed(3)}`);
                }


                // Recalculate box and center after scaling
                box.setFromObject(currentModel);
                box.getCenter(center);

                // Move model's center to the world origin (0,0,0)
                currentModel.position.sub(center);
                console.log(`Model centered at origin.`);

                 // Optional: Adjust controls target to look at the model's new center (which is now 0,0,0)
                 controls.target.set(0, 0, 0);
                 // Optionally, reset camera position based on size
                 // camera.position.set(0, size.y * scale * 0.6 , size.z * scale * 1.5); // Example positioning

            } catch (error) {
                 console.error("Error during auto-centering/scaling:", error);
                 // Proceed without centering/scaling if it fails
            }
             // --- ------------------------------ ---


            // --- Optional: Enable shadows for all meshes ---
            /*
            currentModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            */
            // --- --------------------------------------- ---

            scene.add(currentModel); // Add the loaded and processed model to the scene
            loadingIndicator.style.display = 'none'; // Hide indicator
            controls.update(); // Update controls after changing target/camera
        },
        // --- onProgress ---
        (xhr) => {
            if (xhr.lengthComputable) {
                const percentComplete = Math.round((xhr.loaded / xhr.total) * 100);
                loadingIndicator.textContent = `Loading: ${percentComplete}%`;
                // console.log(`Model ${percentComplete}% loaded`);
            } else {
                 loadingIndicator.textContent = `Loading... (${(xhr.loaded / 1024).toFixed(1)} KB)`;
            }
        },
        // --- onError ---
        (error) => {
            console.error('Error loading model:', error);
            loadingIndicator.textContent = 'Error loading model!';
            // Optionally leave the indicator visible on error
        }
    );
}

// --- GUI Setup Function ---
function setupGUI() {
    // Check if GUI library is available (in case import failed)
    if (typeof GUI === 'undefined') {
        console.warn("lil-gui not available, skipping GUI setup.");
        return;
    }

    gui = new GUI({ container: guiContainer }); // Place GUI in its designated container
    gui.domElement.style.position = 'absolute'; // Ensure it's positioned correctly
    gui.domElement.style.top = '10px';
    gui.domElement.style.right = '10px';


    const params = {
        // Parameter object for GUI controls
        model: modelPaths[currentModelIndex], // Reflect current model path
        switchModel: (index) => {
            if (index >= 0 && index < modelPaths.length) {
                currentModelIndex = index;
                params.model = modelPaths[currentModelIndex]; // Update display value
                loadModel(params.model);
                gui.updateDisplay(); // Refresh GUI to show updated model name
            }
        }
    };

    // --- Model Selection Control ---
    // Create an object mapping model names/indices for the dropdown
    const modelOptions = {};
    modelPaths.forEach((path, index) => {
        // Extract a simple name from the path for the dropdown
        const name = path.split('/').pop().replace('.glb', '').replace('.gltf', '');
        modelOptions[name || `Model ${index + 1}`] = index;
    });

    const modelFolder = gui.addFolder('Model Selection');
    modelFolder.add(params, 'model', modelOptions).name('Select Model').onChange((index) => {
        params.switchModel(parseInt(index)); // Pass the selected index
    });
    // --- ------------------------ ---


    // --- Example: Scene Controls ---
    const sceneFolder = gui.addFolder('Scene');
    sceneFolder.add(renderer, 'toneMappingExposure', 0.1, 2.0).name('Exposure');
    sceneFolder.addColor(scene.background, 'getHexString').name('Background').onChange(value => scene.background.set(value));
    // Add more scene controls (fog, etc.) if needed
    // --- ------------------------ ---


    // --- Example: Lighting Controls ---
    // Find the directional light added earlier (assuming only one)
    const dirLight = scene.children.find(obj => obj.isDirectionalLight);
    if (dirLight) {
        const lightFolder = gui.addFolder('Directional Light');
        lightFolder.add(dirLight, 'intensity', 0, 5).name('Intensity');
        lightFolder.addColor(dirLight, 'color').name('Color');
        lightFolder.add(dirLight.position, 'x', -10, 10).name('Pos X');
        lightFolder.add(dirLight.position, 'y', 0, 20).name('Pos Y');
        lightFolder.add(dirLight.position, 'z', -10, 10).name('Pos Z');
    }
    // --- ------------------------- ---

     console.log("GUI setup complete.");
}


// --- Window Resize Handler ---
function onWindowResize() {
    camera.aspect = viewerContainer.clientWidth / viewerContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewerContainer.clientWidth, viewerContainer.clientHeight);
     console.log("Window resized.");
}

// --- Animation Loop ---
function animate() {
    // Request the next frame
    requestAnimationFrame(animate);

    // Update controls (required if enableDamping is true)
    controls.update();

    // Render the scene from the perspective of the camera
    renderer.render(scene, camera);
}

// --- Start the application ---
try {
    init();
} catch (error) {
    console.error("Error during initialization:", error);
    loadingIndicator.textContent = "Initialization Error!";
    loadingIndicator.style.display = 'block';
    // Display a more user-friendly error on the page itself if needed
    viewerContainer.innerHTML = `<div style="color: red; padding: 20px;">Failed to initialize 3D viewer. Check console (F12) for details. Error: ${error.message}</div>`;
}