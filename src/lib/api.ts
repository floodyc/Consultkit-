const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Log API URL on initialization (helps debug configuration issues)
if (typeof window !== 'undefined') {
  console.log('[API] Configuration:', {
    API_URL,
    env: process.env.NEXT_PUBLIC_API_URL,
    defaulting: !process.env.NEXT_PUBLIC_API_URL
  })
}

export class APIClient {
  private token: string | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token')
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(error.detail || 'Request failed')
    }

    return response.json()
  }

  // Auth
  async register(email: string, password: string, fullName: string) {
    return this.request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    })
  }

  async login(email: string, password: string) {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)

    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Login failed')
    }

    const data = await response.json()
    this.setToken(data.access_token)
    return data
  }

  async getMe() {
    return this.request('/api/v1/auth/me')
  }

  // Projects
  async getProjects() {
    const response = await this.request('/api/v1/projects/')
    return response.projects || []
  }

  async createProject(data: {
    name: string
    description?: string
    location?: string
    building_type?: string
  }) {
    const response = await this.request('/api/v1/projects/', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        city: data.location,
        building_type: data.building_type || 'office',
      }),
    })
    return response
  }

  async getProject(id: string) {
    return this.request(`/api/v1/projects/${id}`)
  }

  // Spaces
  async createSpace(projectId: string, data: any) {
    // Transform frontend data to match backend SpaceData model
    const spaceData = {
      id: crypto.randomUUID(),
      name: data.name,
      space_type: 'office', // Default space type
      floor_area: data.area,
      volume: data.area * data.ceiling_height,
      height: data.ceiling_height,
      cooling_setpoint: 24.0,
      heating_setpoint: 21.0,
      lighting_power_density: data.lighting_watts / data.area || 10.0,
      equipment_power_density: 10.0,
    }

    return this.request(`/api/v1/projects/${projectId}/spaces`, {
      method: 'POST',
      body: JSON.stringify(spaceData),
    })
  }

  async getSpaces(projectId: string) {
    return this.request(`/api/v1/projects/${projectId}/spaces`)
  }

  // Calculations
  async runCalculation(projectId: string, data: any) {
    return this.request(`/api/v1/calculations/${projectId}/run`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getCalculationResults(calculationId: string) {
    return this.request(`/api/v1/calculations/${calculationId}/results`)
  }

  // GEM-AI Geometry Extraction
  async uploadFloorplan(projectId: string, file: File) {
    console.log('[API] uploadFloorplan called with:', {
      projectId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    })

    const formData = new FormData()
    formData.append('file', file)
    formData.append('project_id', projectId)

    console.log('[API] FormData entries:')
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.type})` : value)
    }

    const headers: Record<string, string> = {}
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const url = `${API_URL}/api/v1/geometry/upload`
    console.log('[API] Sending POST to:', url)

    let response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      })
    } catch (fetchError: any) {
      console.error('[API] Fetch failed - network error:', fetchError)
      console.error('[API] This usually means:', {
        possibleCauses: [
          'Backend server is not running',
          'CORS is blocking the request',
          'Network connectivity issue',
          'Wrong API_URL configured'
        ],
        currentAPIURL: API_URL,
        attemptedURL: url
      })
      throw new Error(`Network error: ${fetchError.message}. Check console for details.`)
    }

    console.log('[API] Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Error response body:', errorText)

      let error
      try {
        error = JSON.parse(errorText)
      } catch {
        error = { detail: errorText || 'Upload failed' }
      }

      console.error('[API] Parsed error:', error)

      // Handle FastAPI validation errors (array format)
      if (Array.isArray(error.detail)) {
        const messages = error.detail.map((e: any) => {
          console.log('[API] Validation error:', e)
          return e.msg || JSON.stringify(e)
        }).join(', ')
        throw new Error(messages)
      }

      throw new Error(error.detail || 'Upload failed')
    }

    const result = await response.json()
    console.log('[API] Upload successful:', result)
    return result
  }

  async extractGeometry(fileId: string, projectId: string, params?: {
    pixels_per_metre?: number
    floor_height_m?: number
    floor_z_m?: number
    detect_openings?: boolean
  }) {
    console.log('[API] extractGeometry called with:', { fileId, projectId, params })

    // Build query parameters
    const queryParams = new URLSearchParams({ project_id: projectId })

    // Build request body with extraction params
    const body = params ? JSON.stringify(params) : null

    console.log('[API] Request body:', body)
    console.log('[API] Query params:', queryParams.toString())

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const url = `${API_URL}/api/v1/geometry/extract/${fileId}?${queryParams}`
    console.log('[API] Sending POST to:', url)

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    })

    console.log('[API] Extract response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Extract error response:', errorText)

      let error
      try {
        error = JSON.parse(errorText)
      } catch {
        error = { detail: errorText || 'Extraction failed' }
      }

      console.error('[API] Parsed extract error:', error)

      // Handle FastAPI validation errors (array format)
      if (Array.isArray(error.detail)) {
        const messages = error.detail.map((e: any) => {
          console.log('[API] Extract validation error:', e)
          return e.msg || JSON.stringify(e)
        }).join(', ')
        throw new Error(messages)
      }

      throw new Error(error.detail || 'Extraction failed')
    }

    const result = await response.json()
    console.log('[API] Extraction successful:', result)
    return result
  }

  async applyGeometryToProject(projectId: string, extractionData: any) {
    return this.request(`/api/v1/geometry/apply-to-project/${projectId}`, {
      method: 'POST',
      body: JSON.stringify(extractionData),
    })
  }
}

export const api = new APIClient()
