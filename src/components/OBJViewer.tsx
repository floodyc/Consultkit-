'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface OBJViewerProps {
  objContent: string
  width?: number
  height?: number
}

export default function OBJViewer({ objContent, width = 600, height = 400 }: OBJViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const meshRef = useRef<THREE.Group | null>(null)

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

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(10, 10, 10)
    scene.add(directionalLight)

    // Grid helper
    const gridHelper = new THREE.GridHelper(100, 100, 0xcccccc, 0xeeeeee)
    scene.add(gridHelper)

    // Axes helper
    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)

    // Parse OBJ content
    const geometry = parseOBJ(objContent)

    // Create mesh with material
    const material = new THREE.MeshPhongMaterial({
      color: 0x4f46e5,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    })

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)
    meshRef.current = new THREE.Group()
    meshRef.current.add(mesh)

    // Add wireframe overlay
    const wireframe = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 })
    )
    mesh.add(wireframe)

    // Calculate bounding box and center camera
    geometry.computeBoundingBox()
    const boundingBox = geometry.boundingBox!
    const center = new THREE.Vector3()
    boundingBox.getCenter(center)

    const size = new THREE.Vector3()
    boundingBox.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)

    // Position camera to see the entire model
    camera.position.set(
      center.x + maxDim * 1.5,
      center.y + maxDim * 1.5,
      center.z + maxDim * 1.5
    )
    camera.lookAt(center)

    // Animation loop
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)

      // Slow rotation for better viewing
      if (meshRef.current) {
        meshRef.current.rotation.y += 0.005
      }

      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId)
      renderer.dispose()
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [objContent, width, height])

  return (
    <div className="flex flex-col items-center">
      <div
        ref={containerRef}
        className="border border-gray-300 rounded-lg overflow-hidden"
        style={{ width, height }}
      />
      <div className="mt-2 text-sm text-gray-600">
        <p>🔄 Auto-rotating • Use mouse to interact (coming soon)</p>
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
