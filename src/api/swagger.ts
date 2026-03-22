import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Flight Status Simulator API',
      version: '1.0.0',
      description: 'REST API that simulates a commercial flight from LAX to JFK with real-time metrics',
    },
    servers: [{ url: '/', description: 'Local server' }],
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
            currentMetrics: {
              nullable: true,
              $ref: '#/components/schemas/FlightMetrics',
            },
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
  },
  apis: ['./src/api/flight-routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
