import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './msw/server'

// jsdom no implementa scrollIntoView (lo usamos para mantener a la vista la
// opción activa del combobox). Lo silenciamos con un no-op para no ensuciar la
// salida de tests con avisos "Not implemented".
Element.prototype.scrollIntoView = () => {}

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
