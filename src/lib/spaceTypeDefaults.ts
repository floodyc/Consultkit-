/**
 * Default space type parameters based on building energy codes
 *
 * Sources:
 * - NECB 2020 (National Energy Code of Canada for Buildings)
 * - ASHRAE 90.1-2019 (ANSI/ASHRAE/IES Standard)
 *
 * All values are in Imperial units (sq ft, W, people)
 */

export interface SpaceTypeDefaults {
  // Occupancy (people per 1000 sq ft)
  occupancy_per_1000sf: number

  // Lighting Power Density (W per sq ft)
  lighting_power_density: number

  // Equipment/Plug Load Density (W per sq ft)
  equipment_power_density: number

  // Default ceiling height (ft)
  default_ceiling_height: number

  // Outdoor air requirements (CFM per person)
  outdoor_air_per_person: number

  // Typical setpoints (°F)
  cooling_setpoint: number
  heating_setpoint: number
}

export type DesignStandard = 'NECB_2020' | 'ASHRAE_90_1'

export const SPACE_TYPE_DEFAULTS: Record<DesignStandard, Record<string, SpaceTypeDefaults>> = {
  ASHRAE_90_1: {
    office: {
      occupancy_per_1000sf: 50, // 5 people per 100 sq ft
      lighting_power_density: 1.1,
      equipment_power_density: 1.0,
      default_ceiling_height: 9.0,
      outdoor_air_per_person: 5,
      cooling_setpoint: 75,
      heating_setpoint: 70,
    },
    office_enclosed: {
      occupancy_per_1000sf: 50,
      lighting_power_density: 1.1,
      equipment_power_density: 1.0,
      default_ceiling_height: 9.0,
      outdoor_air_per_person: 5,
      cooling_setpoint: 75,
      heating_setpoint: 70,
    },
    office_open: {
      occupancy_per_1000sf: 60,
      lighting_power_density: 0.98,
      equipment_power_density: 0.95,
      default_ceiling_height: 9.0,
      outdoor_air_per_person: 5,
      cooling_setpoint: 75,
      heating_setpoint: 70,
    },
    conference: {
      occupancy_per_1000sf: 500, // 50 people per 100 sq ft
      lighting_power_density: 1.23,
      equipment_power_density: 0.25,
      default_ceiling_height: 9.0,
      outdoor_air_per_person: 5,
      cooling_setpoint: 74,
      heating_setpoint: 70,
    },
    meeting: {
      occupancy_per_1000sf: 300,
      lighting_power_density: 1.2,
      equipment_power_density: 0.3,
      default_ceiling_height: 9.0,
      outdoor_air_per_person: 5,
      cooling_setpoint: 74,
      heating_setpoint: 70,
    },
    classroom: {
      occupancy_per_1000sf: 350, // 35 people per 100 sq ft
      lighting_power_density: 1.24,
      equipment_power_density: 0.75,
      default_ceiling_height: 10.0,
      outdoor_air_per_person: 10,
      cooling_setpoint: 74,
      heating_setpoint: 70,
    },
    lobby: {
      occupancy_per_1000sf: 100,
      lighting_power_density: 0.9,
      equipment_power_density: 0.25,
      default_ceiling_height: 12.0,
      outdoor_air_per_person: 5,
      cooling_setpoint: 75,
      heating_setpoint: 68,
    },
    corridor: {
      occupancy_per_1000sf: 0,
      lighting_power_density: 0.66,
      equipment_power_density: 0.0,
      default_ceiling_height: 9.0,
      outdoor_air_per_person: 0,
      cooling_setpoint: 78,
      heating_setpoint: 68,
    },
    restroom: {
      occupancy_per_1000sf: 20,
      lighting_power_density: 0.98,
      equipment_power_density: 0.1,
      default_ceiling_height: 9.0,
      outdoor_air_per_person: 50, // Higher for restrooms
      cooling_setpoint: 75,
      heating_setpoint: 70,
    },
    storage: {
      occupancy_per_1000sf: 5,
      lighting_power_density: 0.63,
      equipment_power_density: 0.0,
      default_ceiling_height: 10.0,
      outdoor_air_per_person: 0,
      cooling_setpoint: 80,
      heating_setpoint: 65,
    },
    mechanical: {
      occupancy_per_1000sf: 5,
      lighting_power_density: 0.95,
      equipment_power_density: 0.5,
      default_ceiling_height: 12.0,
      outdoor_air_per_person: 0,
      cooling_setpoint: 85,
      heating_setpoint: 60,
    },
    server: {
      occupancy_per_1000sf: 5,
      lighting_power_density: 1.45,
      equipment_power_density: 20.0, // Very high for servers
      default_ceiling_height: 10.0,
      outdoor_air_per_person: 0,
      cooling_setpoint: 70,
      heating_setpoint: 65,
    },
    cafeteria: {
      occupancy_per_1000sf: 1000, // 100 people per 100 sq ft (dining)
      lighting_power_density: 0.89,
      equipment_power_density: 2.0,
      default_ceiling_height: 10.0,
      outdoor_air_per_person: 7.5,
      cooling_setpoint: 74,
      heating_setpoint: 70,
    },
    kitchen: {
      occupancy_per_1000sf: 200,
      lighting_power_density: 1.21,
      equipment_power_density: 12.0, // High for cooking equipment
      default_ceiling_height: 10.0,
      outdoor_air_per_person: 15,
      cooling_setpoint: 76,
      heating_setpoint: 68,
    },
    retail: {
      occupancy_per_1000sf: 150,
      lighting_power_density: 1.59,
      equipment_power_density: 0.5,
      default_ceiling_height: 12.0,
      outdoor_air_per_person: 7.5,
      cooling_setpoint: 74,
      heating_setpoint: 70,
    },
    warehouse: {
      occupancy_per_1000sf: 5,
      lighting_power_density: 0.8,
      equipment_power_density: 0.25,
      default_ceiling_height: 20.0,
      outdoor_air_per_person: 0,
      cooling_setpoint: 80,
      heating_setpoint: 60,
    },
  },

  NECB_2020: {
    office: {
      occupancy_per_1000sf: 50,
      lighting_power_density: 1.0,
      equipment_power_density: 0.95,
      default_ceiling_height: 9.0,
      outdoor_air_per_person: 5,
      cooling_setpoint: 75,
      heating_setpoint: 70,
    },
    office_enclosed: {
      occupancy_per_1000sf: 50,
      lighting_power_density: 1.0,
      equipment_power_density: 0.95,
      default_ceiling_height: 9.0,
      outdoor_air_per_person: 5,
      cooling_setpoint: 75,
      heating_setpoint: 70,
    },
    office_open: {
      occupancy_per_1000sf: 60,
      lighting_power_density: 0.9,
      equipment_power_density: 0.9,
      default_ceiling_height: 9.0,
      outdoor_air_per_person: 5,
      cooling_setpoint: 75,
      heating_setpoint: 70,
    },
    conference: {
      occupancy_per_1000sf: 500,
      lighting_power_density: 1.2,
      equipment_power_density: 0.25,
      default_ceiling_height: 9.0,
      outdoor_air_per_person: 5,
      cooling_setpoint: 74,
      heating_setpoint: 70,
    },
    meeting: {
      occupancy_per_1000sf: 300,
      lighting_power_density: 1.15,
      equipment_power_density: 0.3,
      default_ceiling_height: 9.0,
      outdoor_air_per_person: 5,
      cooling_setpoint: 74,
      heating_setpoint: 70,
    },
    classroom: {
      occupancy_per_1000sf: 350,
      lighting_power_density: 1.3,
      equipment_power_density: 0.7,
      default_ceiling_height: 10.0,
      outdoor_air_per_person: 10,
      cooling_setpoint: 74,
      heating_setpoint: 70,
    },
    lobby: {
      occupancy_per_1000sf: 100,
      lighting_power_density: 0.85,
      equipment_power_density: 0.25,
      default_ceiling_height: 12.0,
      outdoor_air_per_person: 5,
      cooling_setpoint: 75,
      heating_setpoint: 68,
    },
    corridor: {
      occupancy_per_1000sf: 0,
      lighting_power_density: 0.6,
      equipment_power_density: 0.0,
      default_ceiling_height: 9.0,
      outdoor_air_per_person: 0,
      cooling_setpoint: 78,
      heating_setpoint: 68,
    },
    restroom: {
      occupancy_per_1000sf: 20,
      lighting_power_density: 0.9,
      equipment_power_density: 0.1,
      default_ceiling_height: 9.0,
      outdoor_air_per_person: 50,
      cooling_setpoint: 75,
      heating_setpoint: 70,
    },
    storage: {
      occupancy_per_1000sf: 5,
      lighting_power_density: 0.6,
      equipment_power_density: 0.0,
      default_ceiling_height: 10.0,
      outdoor_air_per_person: 0,
      cooling_setpoint: 80,
      heating_setpoint: 65,
    },
    mechanical: {
      occupancy_per_1000sf: 5,
      lighting_power_density: 0.9,
      equipment_power_density: 0.5,
      default_ceiling_height: 12.0,
      outdoor_air_per_person: 0,
      cooling_setpoint: 85,
      heating_setpoint: 60,
    },
    server: {
      occupancy_per_1000sf: 5,
      lighting_power_density: 1.4,
      equipment_power_density: 20.0,
      default_ceiling_height: 10.0,
      outdoor_air_per_person: 0,
      cooling_setpoint: 70,
      heating_setpoint: 65,
    },
    cafeteria: {
      occupancy_per_1000sf: 1000,
      lighting_power_density: 0.85,
      equipment_power_density: 2.0,
      default_ceiling_height: 10.0,
      outdoor_air_per_person: 7.5,
      cooling_setpoint: 74,
      heating_setpoint: 70,
    },
    kitchen: {
      occupancy_per_1000sf: 200,
      lighting_power_density: 1.2,
      equipment_power_density: 12.0,
      default_ceiling_height: 10.0,
      outdoor_air_per_person: 15,
      cooling_setpoint: 76,
      heating_setpoint: 68,
    },
    retail: {
      occupancy_per_1000sf: 150,
      lighting_power_density: 1.5,
      equipment_power_density: 0.5,
      default_ceiling_height: 12.0,
      outdoor_air_per_person: 7.5,
      cooling_setpoint: 74,
      heating_setpoint: 70,
    },
    warehouse: {
      occupancy_per_1000sf: 5,
      lighting_power_density: 0.75,
      equipment_power_density: 0.25,
      default_ceiling_height: 20.0,
      outdoor_air_per_person: 0,
      cooling_setpoint: 80,
      heating_setpoint: 60,
    },
  },
}

/**
 * Get defaults for a space type based on the design standard
 */
export function getSpaceTypeDefaults(
  spaceType: string,
  standard: DesignStandard = 'ASHRAE_90_1'
): SpaceTypeDefaults {
  const defaults = SPACE_TYPE_DEFAULTS[standard][spaceType]

  if (!defaults) {
    // Return generic office defaults if space type not found
    return SPACE_TYPE_DEFAULTS[standard]['office']
  }

  return defaults
}

/**
 * Apply defaults to a space based on its area and type
 */
export function applySpaceTypeDefaults(
  spaceType: string,
  area: number,
  standard: DesignStandard = 'ASHRAE_90_1'
): Partial<{
  occupancy: number
  lighting_watts: number
  ceiling_height: number
  lighting_power_density: number
  equipment_power_density: number
  cooling_setpoint: number
  heating_setpoint: number
}> {
  const defaults = getSpaceTypeDefaults(spaceType, standard)

  return {
    occupancy: Math.round((area / 1000) * defaults.occupancy_per_1000sf),
    lighting_watts: Math.round(area * defaults.lighting_power_density),
    ceiling_height: defaults.default_ceiling_height,
    lighting_power_density: defaults.lighting_power_density,
    equipment_power_density: defaults.equipment_power_density,
    cooling_setpoint: defaults.cooling_setpoint,
    heating_setpoint: defaults.heating_setpoint,
  }
}
