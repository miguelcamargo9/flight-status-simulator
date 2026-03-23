export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Flight Status Simulator API',
    version: '1.0.0',
    description: 'REST API that simulates a commercial flight from LAX to JFK with real-time metrics',
  },
  servers: [{ url: '/', description: 'Local server' }],
  paths: {
    '/flights': {
      post: {
        summary: 'Start a new flight simulation',
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateFlightRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Flight simulation started',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Flight' } } },
          },
          400: {
            description: 'Validation error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
      get: {
        summary: 'List all flights (active and completed)',
        responses: {
          200: {
            description: 'List of flights',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Flight' } },
              },
            },
          },
        },
      },
    },
    '/flights/{id}': {
      get: {
        summary: 'Get current flight status and latest metrics',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: {
            description: 'Flight details with current metrics',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Flight' } } },
          },
          404: {
            description: 'Flight not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/flights/{id}/history': {
      get: {
        summary: 'Get full metric history for a flight',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: {
            description: 'Array of metric snapshots',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/FlightMetrics' } },
              },
            },
          },
          404: {
            description: 'Flight not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/flights/{id}/stream': {
      get: {
        summary: 'Real-time metric streaming via SSE',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: {
            description: 'Server-Sent Events stream of flight metrics',
            content: { 'text/event-stream': { schema: { type: 'string' } } },
          },
          404: {
            description: 'Flight not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Position: {
        type: 'object',
        properties: {
          latitude: { type: 'number', example: 36.8529 },
          longitude: { type: 'number', example: -98.3456 },
        },
      },
      FlightMetrics: {
        type: 'object',
        properties: {
          phase: {
            type: 'string',
            enum: ['boarding', 'taxi_out', 'takeoff_climb', 'cruise', 'descent', 'landing', 'taxi_in', 'arrived'],
          },
          altitude: { type: 'number', description: 'Altitude in feet', example: 35000 },
          airspeed: { type: 'number', description: 'Speed in knots', example: 460 },
          heading: { type: 'number', description: 'Heading in degrees', example: 66.3 },
          position: { $ref: '#/components/schemas/Position' },
          fuelRemaining: { type: 'number', description: 'Fuel remaining (%)', example: 72.5 },
          outsideAirTemperature: { type: 'number', description: 'Temperature in °C', example: -56.5 },
          eta: { type: 'number', description: 'Minutes remaining', example: 185 },
          elapsedMinutes: { type: 'number', example: 135 },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      Flight: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          callsign: { type: 'string', example: 'SIM001' },
          status: { type: 'string', enum: ['active', 'completed'] },
          timeScale: { type: 'number', example: 60 },
          startedAt: { type: 'string', format: 'date-time' },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
          currentMetrics: { nullable: true, $ref: '#/components/schemas/FlightMetrics' },
        },
      },
      CreateFlightRequest: {
        type: 'object',
        properties: {
          callsign: { type: 'string', default: 'SIM001', pattern: '^[A-Z0-9]+$' },
          timeScale: { type: 'number', default: 60, minimum: 1, maximum: 300 },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  },
};
