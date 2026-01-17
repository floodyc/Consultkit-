const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
    const formData = new FormData()
    formData.append('file', file)
    formData.append('project_id', projectId)

    const headers: Record<string, string> = {}
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${API_URL}/api/v1/geometry/upload`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }))

      // Handle FastAPI validation errors (array format)
      if (Array.isArray(error.detail)) {
        const messages = error.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ')
        throw new Error(messages)
      }

      throw new Error(error.detail || 'Upload failed')
    }

    return response.json()
  }

  async extractGeometry(fileId: string, projectId: string, params?: {
    pixels_per_metre?: number
    floor_height_m?: number
    floor_z_m?: number
    detect_openings?: boolean
  }) {
    // Build query parameters
    const queryParams = new URLSearchParams({ project_id: projectId })

    // Build request body with extraction params
    const body = params ? JSON.stringify(params) : null

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${API_URL}/api/v1/geometry/extract/${fileId}?${queryParams}`, {
      method: 'POST',
      headers,
      body,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Extraction failed' }))

      // Handle FastAPI validation errors (array format)
      if (Array.isArray(error.detail)) {
        const messages = error.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ')
        throw new Error(messages)
      }

      throw new Error(error.detail || 'Extraction failed')
    }

    return response.json()
  }

  async applyGeometryToProject(projectId: string, extractionData: any) {
    return this.request(`/api/v1/geometry/apply-to-project/${projectId}`, {
      method: 'POST',
      body: JSON.stringify(extractionData),
    })
  }
}

export const api = new APIClient()
