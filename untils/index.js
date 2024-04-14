import pino from 'pino'

export const logger = pino({ level: Bun.env.DEBUG_LEVEL || 'info' })