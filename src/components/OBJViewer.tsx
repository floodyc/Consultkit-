'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

interface Room {
  id: string
  name: string
  x: number
  y: number
  z: number
  width: number
  depth: number
  height: number
  cooling_load?: number  // W
  heating_load?: number  // W
}

interface OBJViewerProps {
  objContent: string
  rooms?: Room[]
  width?: number
  height?: number
  showLoads?: boolean
}

export default function OBJViewer({ objContent, rooms = [], width = 600, height = 400, showLoads = false }: OBJViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const meshRef = useRef<THREE.Mesh | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    )
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Parse OBJ content first to get geometry size
    console.log('[OBJViewer] OBJ content length:', objContent.length)
    console.log('[OBJViewer] OBJ content preview:', objContent.substring(0, 500))

    const geometry = parseOBJ(objContent)
    console.log('[OBJViewer] Parsed geometry:', {
      vertexCount: geometry.attributes.position?.count || 0,
      indexCount: geometry.index?.count || 0,
      hasPosition: !!geometry.attributes.position,
      hasIndex: !!geometry.index,
    })

    // Calculate bounding box for proper scaling
    geometry.computeBoundingBox()
    const boundingBox = geometry.boundingBox!
    console.log('[OBJViewer] Bounding box:', {
      min: boundingBox.min,
      max: boundingBox.max,
    })

    const center = new THREE.Vector3()
    boundingBox.getCenter(center)

    const size = new THREE.Vector3()
    boundingBox.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)

    console.log('[OBJViewer] Geometry info:', {
      center: center,
      size: size,
      maxDim: maxDim,
    })

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(maxDim, maxDim, maxDim)
    scene.add(directionalLight)

    // Grid helper - sized to match geometry
    const gridSize = Math.max(maxDim * 2, 10)
    const gridDivisions = Math.ceil(gridSize / 2)
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0xcccccc, 0xeeeeee)
    gridHelper.position.y = boundingBox.min.y // Place grid at floor level
    scene.add(gridHelper)

    // Axes helper - scaled to geometry
    const axesHelper = new THREE.AxesHelper(maxDim * 0.5)
    scene.add(axesHelper)

    // Create mesh with material - solid and opaque
    const material = new THREE.MeshPhongMaterial({
      color: 0x4f46e5,
      side: THREE.DoubleSide,
      transparent: false,
      opacity: 1.0,
      shininess: 30,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    console.log('[OBJViewer] Created mesh:', {
      visible: mesh.visible,
      position: mesh.position,
      geometryVertices: geometry.attributes.position?.count,
    })

    scene.add(mesh)
    meshRef.current = mesh

    // Add wireframe overlay
    const wireframe = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 })
    )
    mesh.add(wireframe)
    console.log('[OBJViewer] Added wireframe, total children:', mesh.children.length)

    // Add room labels if rooms data is provided
    if (rooms && rooms.length > 0) {
      console.log('[OBJViewer] Adding labels for', rooms.length, 'rooms')
      rooms.forEach((room) => {
        // Create canvas for text
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (!context) return

        canvas.width = 256
        canvas.height = showLoads ? 96 : 64

        // Draw text on canvas
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)

        // Room name
        context.font = 'Bold 20px Arial'
        context.fillStyle = '#000000'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillText(room.name, canvas.width / 2, showLoads ? 20 : canvas.height / 2)

        // Load values if requested
        if (showLoads && (room.cooling_load !== undefined || room.heating_load !== undefined)) {
          context.font = '16px Arial'
          if (room.cooling_load !== undefined) {
            context.fillStyle = '#2563eb'  // Blue for cooling
            const coolingText = `❄️ ${(room.cooling_load / 1000).toFixed(1)} kW`
            context.fillText(coolingText, canvas.width / 2, 48)
          }
          if (room.heating_load !== undefined) {
            context.fillStyle = '#dc2626'  // Red for heating
            const heatingText = `🔥 ${(room.heating_load / 1000).toFixed(1)} kW`
            context.fillText(heatingText, canvas.width / 2, 72)
          }
        }

        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas)
        const spriteMaterial = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
        })
        const sprite = new THREE.Sprite(spriteMaterial)

        // Position sprite at center of room, slightly above floor
        sprite.position.set(
          room.x + room.width / 2,
          room.z + room.height * 0.9,
          room.y + room.depth / 2
        )

        // Scale sprite based on room size
        const labelScale = Math.min(room.width, room.depth) * 0.4
        const labelHeight = showLoads ? 0.375 : 0.25  // Taller labels when showing loads
        sprite.scale.set(labelScale, labelScale * labelHeight, 1)

        scene.add(sprite)
        console.log('[OBJViewer] Added label for room:', room.name, 'at', sprite.position)
      })
    }

    // Position camera much closer to fill the viewport
    const distance = maxDim * 1.2
    camera.position.set(
      center.x + distance * 0.6,
      center.y + distance * 0.8,
      center.z + distance * 0.6
    )
    camera.lookAt(center)

    // Add orbit controls for interactive viewing
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.copy(center)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.screenSpacePanning = false
    controls.minDistance = maxDim * 0.5
    controls.maxDistance = maxDim * 5
    controls.maxPolarAngle = Math.PI / 2 // Don't go below ground
    controls.update()

    // Animation loop
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)

      // Update controls for smooth damping
      controls.update()

      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId)
      controls.dispose()
      renderer.dispose()
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [objContent, width, height, rooms, showLoads])

  return (
    <div className="flex flex-col items-center">
      <div
        ref={containerRef}
        className="border border-gray-300 rounded-lg overflow-hidden"
        style={{ width, height }}
      />
      <div className="mt-2 text-sm text-gray-600 text-center">
        <p className="font-medium">🖱️ Interactive Controls:</p>
        <p className="text-xs mt-1">
          Left-click + drag: Rotate • Right-click + drag: Pan • Scroll: Zoom
        </p>
      </div>
    </div>
  )
}

/**
 * Simple OBJ parser for basic geometry
 */
function parseOBJ(objContent: string): THREE.BufferGeometry {
  const vertices: number[] = []
  const indices: number[] = []

  const lines = objContent.split('\n')
  const vertexArray: [number, number, number][] = []

  for (const line of lines) {
    const parts = line.trim().split(/\s+/)

    if (parts[0] === 'v') {
      // Vertex
      const x = parseFloat(parts[1])
      const y = parseFloat(parts[2])
      const z = parseFloat(parts[3])
      vertexArray.push([x, y, z])
    } else if (parts[0] === 'f') {
      // Face (convert from 1-indexed to 0-indexed)
      const faceIndices = parts.slice(1).map(p => {
        const idx = parseInt(p.split('/')[0])
        return idx - 1 // OBJ uses 1-indexed vertices
      })

      // Triangulate quads and higher polygons
      if (faceIndices.length === 3) {
        indices.push(...faceIndices)
      } else if (faceIndices.length === 4) {
        // Quad to two triangles
        indices.push(faceIndices[0], faceIndices[1], faceIndices[2])
        indices.push(faceIndices[0], faceIndices[2], faceIndices[3])
      } else if (faceIndices.length > 4) {
        // Fan triangulation for n-gons
        for (let i = 1; i < faceIndices.length - 1; i++) {
          indices.push(faceIndices[0], faceIndices[i], faceIndices[i + 1])
        }
      }
    }
  }

  // Flatten vertex array
  for (const vertex of vertexArray) {
    vertices.push(...vertex)
  }

  // Create geometry
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}
