import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import * as dat from 'lil-gui'

/* ---------- Setup ---------- */
const gui = new dat.GUI()
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

/* ---------- Material & Texture ---------- */
const texture = new THREE.TextureLoader().load('/textures/matcaps/3.png')
texture.mapping = THREE.EquirectangularReflectionMapping
texture.encoding = THREE.sRGBEncoding

const material = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 0.7,
  roughness: 0.25,
  envMap: texture,
  envMapIntensity: 1.2,
  emissive: 0x000000
})

/* ---------- GUI Controls ---------- */
const params = {
  color: material.color.getHex(),
  brightness: 1,
  moveStars: false,
  bloomStrength: 1,
  bloomRadius: 0.4,
  bloomThreshold: 0.2
}

gui.addColor(params, 'color').name('Color').onChange(v => material.color.set(v))
gui.add(material, 'metalness', 0, 1, 0.01)
gui.add(material, 'roughness', 0, 1, 0.01)
gui.add(material, 'envMapIntensity', 0, 3, 0.01).name('Brightness')
gui.add(params, 'moveStars').name('Move Stars')
const bloomFolder = gui.addFolder('Bloom')
bloomFolder.add(params, 'bloomStrength', 0, 3, 0.01)
bloomFolder.add(params, 'bloomRadius', 0, 1, 0.01)
bloomFolder.add(params, 'bloomThreshold', 0, 1, 0.01)

/* ---------- Lights ---------- */
const ambient = new THREE.AmbientLight(0xffffff, 0.4)
const point = new THREE.PointLight(0xffffff, 1.8)
point.position.set(5, 5, 5)
scene.add(ambient, point)

/* ---------- Star Creation ---------- */
function createStar(size = 1) {
  const shape = new THREE.Shape()
  const outer = size, inner = size / 2.5
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2
    const r = i % 2 === 0 ? outer : inner
    shape[i ? 'lineTo' : 'moveTo'](Math.cos(angle) * r, Math.sin(angle) * r)
  }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: true, bevelSegments: 10, bevelSize: 0.2, bevelThickness: 0.2 })
  geo.center()
  return geo
}

const stars = new THREE.Group()
scene.add(stars)

for (let i = 0; i < 100; i++) {
  const star = new THREE.Mesh(createStar(0.5 + Math.random() * 0.3), material)
  star.position.set((Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80)
  const s = Math.random() * 1.2 + 0.6
  star.scale.setScalar(s)
  star.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
  stars.add(star)
}

/* ---------- Camera + Controls ---------- */
const sizes = { width: innerWidth, height: innerHeight }
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 300)
camera.position.set(0, 0, 10)
scene.add(camera)

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

// Keyboard navigation
const moveSpeed = 1
window.addEventListener('keydown', e => {
  const key = e.key.toLowerCase()
  if (key === 'w') camera.position.z -= moveSpeed
  if (key === 's') camera.position.z += moveSpeed
  if (key === 'a') camera.position.x -= moveSpeed
  if (key === 'd') camera.position.x += moveSpeed
  if (key === 'q') camera.position.y += moveSpeed
  if (key === 'e') camera.position.y -= moveSpeed
})

/* ---------- Renderer + PostFX ---------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.setClearColor(0x000010)
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ACESFilmicToneMapping

const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
const bloom = new UnrealBloomPass(new THREE.Vector2(sizes.width, sizes.height), params.bloomStrength, params.bloomRadius, params.bloomThreshold)
composer.addPass(bloom)

/* ---------- Raycaster ---------- */
const raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2()
let activeStar = null, targetStar = null

window.addEventListener('mousemove', e => {
    mouse.x = (e.clientX / sizes.width) * 2 - 1
    mouse.y = -(e.clientY / sizes.height) * 2 + 1
})

function highlightStars() {
    raycaster.setFromCamera(mouse, camera)
    const hits = raycaster.intersectObjects(stars.children)
    if (activeStar) activeStar.material.emissive.set(0x000000)
    if (hits.length > 0) {
        activeStar = hits[0].object
        activeStar.material.emissive.set(0xffff88)
    }
}

/* ---------- Info Box ---------- */
const infoBox = document.createElement('div')
Object.assign(infoBox.style, {
    position: 'absolute', top: '20px', left: '20px', color: 'white',
    background: 'rgba(0,0,0,0.6)', padding: '10px 15px', borderRadius: '8px',
    fontFamily: 'sans-serif', opacity: '0', transition: 'opacity 0.3s', pointerEvents: 'none'
})
document.body.appendChild(infoBox)

/* ---------- Click Interaction ---------- */
window.addEventListener('click', () => {
    raycaster.setFromCamera(mouse, camera)
    const hit = raycaster.intersectObjects(stars.children)[0]

    if (hit) {
        const s = hit.object
        targetStar = s
        s.material.emissive.set(0xffff99)
        s.scale.multiplyScalar(1.5)
        setTimeout(() => { s.scale.divideScalar(1.5); s.material.emissive.set(0x000000) }, 500)
        infoBox.textContent = `Star clicked!
    x=${s.position.x.toFixed(1)}, y=${s.position.y.toFixed(1)}, z=${s.position.z.toFixed(1)}`
        infoBox.style.opacity = 1
    } else {
        infoBox.style.opacity = 0
        targetStar = null
    }
})

/* ---------- Animation ---------- */
const clock = new THREE.Clock()
const spinSpeeds = stars.children.map(() => ({ x: (Math.random() - 0.5) * 0.03, y: (Math.random() - 0.5) * 0.03 }))
const driftOffsets = stars.children.map(() => ({ x: Math.random() * 10, y: Math.random() * 10, z: Math.random() * 10 }))

function animate() {
    const t = clock.getElapsedTime()

    stars.children.forEach((s, i) => {
        const pulse = Math.sin(t * 3 + i) * 0.25 + 1
        s.scale.setScalar(pulse)
        s.rotation.x += spinSpeeds[i].x
        s.rotation.y += spinSpeeds[i].y
        if (params.moveStars) {
        s.position.x += Math.sin(t + driftOffsets[i].x) * 0.02
        s.position.y += Math.cos(t * 1.2 + driftOffsets[i].y) * 0.02
        s.position.z += Math.sin(t * 0.8 + driftOffsets[i].z) * 0.02
        }
  })

    highlightStars()

    if (targetStar) {
        const focus = targetStar.position.clone().add(new THREE.Vector3(0, 0, 5))
        camera.position.lerp(focus, 0.05)
        controls.target.lerp(targetStar.position, 0.05)
  }

    ambient.intensity = 0.4 * params.brightness
    point.intensity = 1.8 * params.brightness
    Object.assign(bloom, {
        strength: params.bloomStrength,
        radius: params.bloomRadius,
        threshold: params.bloomThreshold
  })

    controls.update()
    composer.render()
    requestAnimationFrame(animate)
}
animate()

/* ---------- Resize ---------- */
window.addEventListener('resize', () => {
    sizes.width = innerWidth
    sizes.height = innerHeight
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
    composer.setSize(sizes.width, sizes.height)
})
