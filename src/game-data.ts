/** Catálogo editable: sustituye nombres, preguntas, imágenes y audios por tu contenido final. */
export type Agent = {
  id: string
  name: string
  color: string
  image: string
  questions: string[]
}

export type Choice = Pick<Agent, 'id' | 'name'> & { isDecoy?: boolean }

export const agents: Agent[] = [
  { id: 'abraham', name: 'Abraham', color: '#D97706', image: '/images/Agentes/A-Abraham.png', questions: ['¿Quién analiza una ubicación propuesta utilizando más de 150 variables de la zona?', '¿Quién solicita la ubicación geográfica exacta de un sitio y da retroalimentación sobre su impacto?'] },
  { id: 'brisa', name: 'Brisa', color: '#0EA5E9', image: '/images/Agentes/A-Brisa.png', questions: ['¿Quién valida mermas analizando fotografías de tickets mediante IA?', '¿Quién extrae automáticamente folios y datos de productos desde tickets de merma?'] },
  { id: 'eva', name: 'Eva', color: '#8B5CF6', image: '/images/Agentes/A-Eva.png', questions: ['¿Quién proporciona planogramas por tienda y catálogos de promociones vigentes?', '¿Quién consulta precios de artículos y genera materiales visuales de capacitación con IA?'] },
  { id: 'javier', name: 'Javier', color: '#14B8A6', image: '/images/Agentes/A-Javier.png', questions: ['¿Quién atiende clientes por WhatsApp mediante una IA conversacional?', '¿Quién clasifica casos como quejas, reclamos, sugerencias o felicitaciones y los asigna al área correspondiente?'] },
  { id: 'victoria', name: 'Victoria', color: '#EC4899', image: '/images/Agentes/A-Victoria.png', questions: ['¿Quién ayuda a agilizar el desbloqueo de límites de efectivo para el pago de faltantes?', '¿Quién verifica que todos los tickets enviados en una sesión pertenezcan a la misma sucursal?'] },
  { id: 'renata', name: 'Renata', color: '#F43F5E', image: '/images/Agentes/A-Renata.png', questions: ['¿Quién me ayuda a consultar precios, ubicaciones de tiendas y contactos de Coaches y Gerentes?'] },
]

/** Distractores: nombres intencionalmente parecidos a los agentes reales. */
export const decoyChoices: Choice[] = [
  { id: 'decoy-abrahan', name: 'Aldebaran', isDecoy: true },
  { id: 'decoy-brissa', name: 'Briana', isDecoy: true },
  { id: 'decoy-eva', name: 'Elena', isDecoy: true },
  { id: 'decoy-javier', name: 'Jaime', isDecoy: true },
  { id: 'decoy-victoria', name: 'Violeta', isDecoy: true },
  { id: 'decoy-renata', name: 'Reina', isDecoy: true },
]

export const providers: Agent[] = [
  { id: 'prisma', name: 'Prisma', color: '#6366F1', image: '/images/Proveedores/prisma.png', questions: ['¿Qué proveedor optimiza precios con posicionamiento competitivo por zona o tienda?', '¿Qué proveedor genera planogramas y optimiza los espacios en el piso de venta?'] },
  { id: 'lapzo', name: 'Lapzo', color: '#F59E0B', image: '/images/Proveedores/lapzo.png', questions: ['¿Qué proveedor crea cursos y rutas de aprendizaje 100% personalizadas con IA?', '¿Qué proveedor tiene una app móvil para que los colaboradores tomen sus cursos incluso sin conexión?'] },
  { id: 'celes', name: 'CELES', color: '#10B981', image: '/images/Proveedores/celes.png', questions: ['¿Qué proveedor genera pronósticos de demanda por IA con vista por SKU y punto de venta?', '¿Qué proveedor ayuda a disminuir la merma por exceso de stock con analítica de inventarios?'] },
  { id: 'rankmi', name: 'Rankmi', color: '#EF4444', image: '/images/Proveedores/rankmi.png', questions: ['¿Qué proveedor gestiona nómina, contratos, firma digital y control de asistencia?', '¿Qué proveedor cuenta con un agente de IA para automatizar tareas de RH y generar insights?'] },
  { id: 'slack', name: 'Slack', color: '#A855F7', image: '/images/Proveedores/slack.png', questions: ['¿Qué proveedor te permite buscar mensajes, archivos y canales, incluyendo tus DMs?', '¿Qué proveedor puede leer y resumir hilos, canvases y PDFs compartidos?'] },
  { id: 'golden-gate-grid', name: 'Golden Gate Grid', color: '#F97316', image: '/images/Proveedores/GoldenGate.jpg', questions: ['¿Qué proveedor es una firma consultora especializada en optimizar inversiones en Slack y Salesforce?', '¿Qué proveedor ofrece los pilares de Kickstart, aceleración con Salesforce y servicios administrados?'] },
]

/** Distractores: nombres intencionalmente parecidos a los proveedores reales. */
export const providerDecoyChoices: Choice[] = [
  { id: 'decoy-prisma', name: 'Prizma', isDecoy: true },
  { id: 'decoy-lapzo', name: 'Lapso', isDecoy: true },
  { id: 'decoy-celes', name: 'Celex', isDecoy: true },
  { id: 'decoy-rankmi', name: 'Rankly', isDecoy: true },
  { id: 'decoy-slack', name: 'Stack', isDecoy: true },
  { id: 'decoy-golden', name: 'Golden State Grid', isDecoy: true },
]

export type Question = { agent: Agent; text: string }

/** Baraja todas las pistas de un catálogo y toma seis para una partida. */
export function createRoundQuestions(pool: Agent[]): Question[] {
  const list = pool.flatMap((agent) => agent.questions.map((text) => ({ agent, text })))
  return [...list].sort(() => Math.random() - 0.5).slice(0, 6)
}

/** RUTAS DE AUDIO: deja vacío para usar tonos generados en el navegador. */
export const sounds = {
  correct: correctSound,
  incorrect: incorrectSound,
}
import correctSound from '../sounds/correct.mp3'
import incorrectSound from '../sounds/incorrect.mp3'
