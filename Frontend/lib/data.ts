export type DocStatus = 'Validado' | 'En Proceso' | 'Pendiente' | 'Completado' | 'Procesando'
export type DocType = 'Contrato' | 'Informe' | 'Propuesta' | 'Reporte' | 'Plan' | 'Análisis'

// Initiative/Project States as per requirements
export type IniciativaEstado =
  | 'Inicial'
  | 'Formalizado'
  | 'En Estimación'
  | 'En Proceso'
  | 'Cerrado'
  | 'Cancelado'

export type MarcoTrabajo = 'Cascada' | 'Ágil'

export type DocumentVersionStatus = 'Pendiente' | 'En Revisión' | 'Aprobado' | 'Rechazado' | 'Firmado'

export interface Autorizador {
  id: string
  nombre: string
  rol: string
  email: string
  tipo: 'Firmante' | 'Revisor' | 'Notificado'
}

export interface EntregableOperativo {
  id: string
  nombre: string
  fase: FaseProyecto
  fechaCompromiso: string
  status: 'Pendiente' | 'En Revisión' | 'Aprobado' | 'Rechazado' | 'Firmado'
  version: string
  archivo?: string
}

export type FaseProyecto = 'Análisis' | 'Arquitectura' | 'Desarrollo' | 'Pruebas' | 'Liberación'

export interface Actividad {
  id: string
  nombre: string
  fase: FaseProyecto
  entregable: string
  fechaInicio: string
  fechaFin: string
  avance: number
  entregableStatus: 'Pendiente' | 'Cargado' | 'Aprobado' | 'Rechazado' | 'Firmado'
}

export interface Iniciativa {
  id: string
  nombre: string
  cliente: string
  estado: IniciativaEstado
  marcoTrabajo: MarcoTrabajo
  prioridad: 'Alta' | 'Media' | 'Baja'
  avanceTotal: number
  presupuesto: string
  fechaInicio: string
  fechaFin: string
  responsable: string
  descripcion: string
  area: string
  miembros: number
  autorizadoresRES: Autorizador[]
  entregables: EntregableOperativo[]
  actividades: Actividad[]
  documentos: {
    res?: { version: string; status: DocumentVersionStatus; fecha: string }
    capa?: { version: string; status: DocumentVersionStatus; fecha: string }
    pse?: { version: string; status: DocumentVersionStatus; fecha: string }
    sola?: { version: string; status: DocumentVersionStatus; fecha: string }
    heuhe?: { version: string; status: DocumentVersionStatus; fecha: string }
  }
  faseActual?: FaseProyecto
  fasesCerradas: FaseProyecto[]
}

export const iniciativas: Iniciativa[] = [
  {
    id: 'INIC-2026-001',
    nombre: 'Modernización Plataforma Tributaria',
    cliente: 'SAT – Servicio de Administración Tributaria',
    estado: 'En Proceso',
    marcoTrabajo: 'Cascada',
    prioridad: 'Alta',
    avanceTotal: 67,
    presupuesto: '$2,450,000',
    fechaInicio: '01 Ene 2026',
    fechaFin: '30 Jun 2026',
    responsable: 'María González',
    descripcion: 'Modernización integral de la plataforma tributaria nacional con migración a la nube y mejora de interfaces de usuario.',
    area: 'Tecnología',
    miembros: 8,
    autorizadoresRES: [
      { id: 'A1', nombre: 'Luis Ramírez', rol: 'Director de TI', email: 'l.ramirez@sat.gob', tipo: 'Firmante' },
      { id: 'A2', nombre: 'Ana Torres', rol: 'Gerente de Proyecto', email: 'a.torres@sat.gob', tipo: 'Revisor' },
    ],
    entregables: [
      { id: 'E1', nombre: 'Documento de Análisis de Requerimientos', fase: 'Análisis', fechaCompromiso: '28 Feb 2026', status: 'Firmado', version: 'v1.2' },
      { id: 'E2', nombre: 'Arquitectura de Solución', fase: 'Arquitectura', fechaCompromiso: '31 Mar 2026', status: 'Aprobado', version: 'v1.0' },
      { id: 'E3', nombre: 'Módulo de Autenticación', fase: 'Desarrollo', fechaCompromiso: '30 Abr 2026', status: 'En Revisión', version: 'v1.0' },
      { id: 'E4', nombre: 'Plan de Pruebas', fase: 'Pruebas', fechaCompromiso: '15 May 2026', status: 'Pendiente', version: 'v0.0' },
    ],
    actividades: [
      { id: 'AC1', nombre: 'Levantamiento de requerimientos funcionales', fase: 'Análisis', entregable: 'Documento de Análisis de Requerimientos', fechaInicio: '01 Ene 2026', fechaFin: '28 Feb 2026', avance: 100, entregableStatus: 'Firmado' },
      { id: 'AC2', nombre: 'Diseño de arquitectura cloud', fase: 'Arquitectura', entregable: 'Arquitectura de Solución', fechaInicio: '01 Mar 2026', fechaFin: '31 Mar 2026', avance: 100, entregableStatus: 'Aprobado' },
      { id: 'AC3', nombre: 'Desarrollo módulo de autenticación', fase: 'Desarrollo', entregable: 'Módulo de Autenticación', fechaInicio: '01 Abr 2026', fechaFin: '30 Abr 2026', avance: 75, entregableStatus: 'En Revisión' },
      { id: 'AC4', nombre: 'Desarrollo módulo fiscal', fase: 'Desarrollo', entregable: 'Módulo Fiscal', fechaInicio: '01 Abr 2026', fechaFin: '31 May 2026', avance: 40, entregableStatus: 'Pendiente' },
    ],
    documentos: {
      res: { version: 'v1.0', status: 'Firmado', fecha: '05 Ene 2026' },
      capa: { version: 'v1.1', status: 'Aprobado', fecha: '20 Ene 2026' },
      pse: { version: 'v1.0', status: 'Firmado', fecha: '15 Ene 2026' },
    },
    faseActual: 'Desarrollo',
    fasesCerradas: ['Análisis', 'Arquitectura'],
  },
  {
    id: 'INIC-2026-002',
    nombre: 'Implementación Sistema de Gestión Documental',
    cliente: 'Ministerio de Hacienda',
    estado: 'En Estimación',
    marcoTrabajo: 'Ágil',
    prioridad: 'Alta',
    avanceTotal: 22,
    presupuesto: '$1,850,000',
    fechaInicio: '15 Feb 2026',
    fechaFin: '15 Jul 2026',
    responsable: 'Carlos Ruiz',
    descripcion: 'Implementación de sistema integral de gestión documental con flujos de aprobación automáticos.',
    area: 'Legal',
    miembros: 12,
    autorizadoresRES: [
      { id: 'A3', nombre: 'Roberto Méndez', rol: 'Subdirector', email: 'r.mendez@hacienda.gob', tipo: 'Firmante' },
    ],
    entregables: [
      { id: 'E5', nombre: 'Product Backlog Inicial', fase: 'Análisis', fechaCompromiso: '28 Feb 2026', status: 'Aprobado', version: 'v1.0' },
    ],
    actividades: [
      { id: 'AC5', nombre: 'Definición del backlog', fase: 'Análisis', entregable: 'Product Backlog Inicial', fechaInicio: '15 Feb 2026', fechaFin: '28 Feb 2026', avance: 100, entregableStatus: 'Aprobado' },
    ],
    documentos: {
      res: { version: 'v1.0', status: 'Firmado', fecha: '18 Feb 2026' },
      capa: { version: 'v1.0', status: 'En Revisión', fecha: '01 Mar 2026' },
    },
    faseActual: 'Análisis',
    fasesCerradas: [],
  },
  {
    id: 'INIC-2026-003',
    nombre: 'Auditoría Integral Sistemas Financieros',
    cliente: 'Banco Central de Reserva',
    estado: 'Formalizado',
    marcoTrabajo: 'Cascada',
    prioridad: 'Media',
    avanceTotal: 5,
    presupuesto: '$980,000',
    fechaInicio: '01 Mar 2026',
    fechaFin: '20 Ago 2026',
    responsable: 'Ana Martínez',
    descripcion: 'Auditoría técnica y de seguridad de los sistemas financieros del banco central.',
    area: 'Auditoría',
    miembros: 5,
    autorizadoresRES: [],
    entregables: [],
    actividades: [],
    documentos: {
      res: { version: 'v1.0', status: 'Firmado', fecha: '05 Mar 2026' },
    },
    faseActual: undefined,
    fasesCerradas: [],
  },
  {
    id: 'INIC-2026-004',
    nombre: 'Digitalización Expedientes Judiciales',
    cliente: 'Poder Judicial',
    estado: 'Inicial',
    marcoTrabajo: 'Cascada',
    prioridad: 'Alta',
    avanceTotal: 0,
    presupuesto: '$3,200,000',
    fechaInicio: '10 Jun 2026',
    fechaFin: '10 Sep 2026',
    responsable: 'Roberto Silva',
    descripcion: 'Digitalización y catalogación de expedientes judiciales con OCR e IA.',
    area: 'Legal',
    miembros: 15,
    autorizadoresRES: [],
    entregables: [],
    actividades: [],
    documentos: {},
    faseActual: undefined,
    fasesCerradas: [],
  },
]

export interface Document {
  id: string
  name: string
  type: DocType
  client: string
  responsible: string
  date: string
  status: DocStatus
  area: string
  tags: string[]
  aiTags: string[]
  priority: 'Alta' | 'Media' | 'Baja'
}

export const documents: Document[] = [
  {
    id: 'PROJ-2026-001',
    name: 'Contrato Marco Servicios Profesionales 2026',
    type: 'Contrato',
    client: 'Ministerio de Hacienda',
    responsible: 'María González',
    date: '15 May 2026',
    status: 'Validado',
    area: 'Legal',
    tags: ['Contrato', 'Legal', 'Firmado', 'Cumplimiento'],
    aiTags: ['Alta Prioridad'],
    priority: 'Alta',
  },
  {
    id: 'PROJ-2026-012',
    name: 'Informe Técnico Infraestructura Cloud Q2',
    type: 'Informe',
    client: 'Secretaría de Transformación Digital',
    responsible: 'Carlos Ruiz',
    date: '20 May 2026',
    status: 'Completado',
    area: 'Tecnología',
    tags: ['Informe', 'Tecnología', 'Revisado', 'Azure'],
    aiTags: [],
    priority: 'Media',
  },
  {
    id: 'PROJ-2026-008',
    name: 'Propuesta Modernización Sistemas Fiscales',
    type: 'Propuesta',
    client: 'SAT – Servicio de Administración Tributaria',
    responsible: 'Ana Martínez',
    date: '22 May 2026',
    status: 'Procesando',
    area: 'Fiscal',
    tags: ['Propuesta', 'Consultoría', 'En Análisis', 'Fiscal', 'Modernización'],
    aiTags: [],
    priority: 'Media',
  },
  {
    id: 'PROJ-2026-015',
    name: 'Reporte Auditoría Seguridad Información',
    type: 'Reporte',
    client: 'Banco Central',
    responsible: 'Roberto Silva',
    date: '18 May 2026',
    status: 'En Proceso',
    area: 'Auditoría',
    tags: ['Reporte', 'Seguridad', 'Auditoría'],
    aiTags: [],
    priority: 'Alta',
  },
  {
    id: 'PROJ-2026-019',
    name: 'Plan Capacitación Digital Funcionarios',
    type: 'Plan',
    client: 'Instituto Nacional de Administración',
    responsible: 'Laura Vega',
    date: '17 May 2026',
    status: 'Pendiente',
    area: 'Recursos Humanos',
    tags: ['Plan', 'Capacitación', 'Digital'],
    aiTags: [],
    priority: 'Baja',
  },
  {
    id: 'PROJ-2026-006',
    name: 'Análisis Impacto Normativa GDPR Local',
    type: 'Análisis',
    client: 'Agencia de Protección de Datos',
    responsible: 'Pedro Morales',
    date: '14 May 2026',
    status: 'En Proceso',
    area: 'Legal',
    tags: ['Análisis', 'GDPR', 'Normativa', 'Privacidad'],
    aiTags: [],
    priority: 'Alta',
  },
]

export const statusConfig: Record<DocStatus, { label: string; className: string }> = {
  'Validado': { label: 'Validado', className: 'pill pill-validated' },
  'Completado': { label: 'Completado', className: 'pill pill-validated' },
  'En Proceso': { label: 'En Proceso', className: 'pill pill-processing' },
  'Procesando': { label: 'Procesando', className: 'pill pill-processing' },
  'Pendiente': { label: 'Pendiente', className: 'pill pill-pending' },
}

export const areaColors: Record<string, string> = {
  'Legal': 'pill pill-legal',
  'Tecnología': 'pill pill-tech',
  'Fiscal': 'pill pill-fiscal',
  'Auditoría': 'pill pill-urgent',
  'Recursos Humanos': 'pill pill-tag',
}

export const estadoIniciativaConfig: Record<IniciativaEstado, { label: string; color: string; bg: string; border: string }> = {
  'Inicial':        { label: 'Inicial',        color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: '#d1d5db' },
  'Formalizado':    { label: 'Formalizado',    color: '#0284c7', bg: 'rgba(2,132,199,0.08)',   border: '#bae6fd' },
  'En Estimación':  { label: 'En Estimación',  color: '#d97706', bg: 'rgba(217,119,6,0.08)',   border: '#fde68a' },
  'En Proceso':     { label: 'En Proceso',     color: '#059669', bg: 'rgba(5,150,105,0.08)',   border: '#a7f3d0' },
  'Cerrado':        { label: 'Cerrado',        color: '#7c3aed', bg: 'rgba(124,58,237,0.08)',  border: '#ddd6fe' },
  'Cancelado':      { label: 'Cancelado',      color: '#dc2626', bg: 'rgba(220,38,38,0.08)',   border: '#fecaca' },
}

export const fasesCascada: FaseProyecto[] = ['Análisis', 'Arquitectura', 'Desarrollo', 'Pruebas', 'Liberación']
export const fasesAgil: FaseProyecto[] = ['Análisis', 'Arquitectura', 'Desarrollo', 'Pruebas', 'Liberación']
