# Premium Real Estate Platform

## Descripción
Premium Real Estate Platform es una aplicación web de nivel profesional diseñada para la gestión y promoción de bienes raíces de lujo. La plataforma ofrece una solución integral que combina un sitio web público de alto impacto visual con un panel administrativo robusto para la gestión de inventario inmobiliario.

El proyecto está diseñado para proporcionar una experiencia de usuario fluida y receptiva, permitiendo a los agentes inmobiliarios gestionar sus propiedades, visualizar métricas de estado y mantener una presencia digital premium con soporte multiidioma.

---

## Características
- **Sitio Público Premium**: Interfaz moderna con secciones de inicio (video hero), nosotros, catálogo de propiedades, servicios y contacto.
- **Panel de Administración (Dashboard)**: Sistema centralizado para la gestión de propiedades, incluyendo visualización en tabla y formularios de creación/edición.
- **Soporte Multiidioma**: Implementación completa de internacionalización (i18n) con soporte para Español e Inglés y detección automática de idioma.
- **Gestión de Propiedades**: Seguimiento de estados de listados (Publicadas, Borradores, Archivadas) y detalles técnicos (área, habitaciones, baños, ubicación).
- **Sistema de Contacto Integrado**: Formularios de contacto con integración directa para WhatsApp, llamadas telefónicas y correo electrónico.
- **Diseño Responsivo**: Interfaz optimizada para dispositivos móviles y de escritorio utilizando Tailwind CSS y componentes de Radix UI.

---

## Arquitectura
La aplicación sigue una arquitectura de **Single Page Application (SPA)** construida con React.

- **Routing Interno**: Utiliza un sistema de gestión de estado para la navegación entre las vistas principales (`Public`, `Login`, `Dashboard`).
- **Localización**: Integración con `i18next` para la gestión dinámica de traducciones mediante archivos JSON locales.
- **Componentización**: Arquitectura basada en componentes modulares, diferenciando componentes de interfaz de usuario (UI) base de componentes de lógica de negocio.
- **Procesamiento de Activos**: Utiliza un plugin personalizado de Vite (`figma-asset-resolver`) para la resolución eficiente de recursos gráficos.

---

## Tecnologías Utilizadas

| Categoría | Tecnología |
|-----------|------------|
| **Core** | React 18, TypeScript |
| **Build Tool** | Vite 6 |
| **Estilos** | Tailwind CSS 4, Emotion |
| **UI Components** | Radix UI, MUI Material |
| **Iconografía** | Lucide React |
| **Internacionalización**| i18next, react-i18next |
| **Formularios** | react-hook-form |
| **Animaciones** | Motion (Framer), tw-animate-css |
| **Gráficos/Métricas** | Recharts |
| **Carruseles** | Embla Carousel, React Slick |

---

## Requisitos
- **Node.js**: Versión 18.0.0 o superior.
- **Gestor de Paquetes**: `pnpm` (recomendado por la presencia de `pnpm-lock.yaml`).

---

## Instalación
Para configurar el entorno de desarrollo local, ejecute los siguientes comandos:

```bash
# Instalar dependencias
pnpm install
```

---

## Ejecución
Comandos disponibles para la gestión del proyecto:

```bash
# Iniciar servidor de desarrollo con Hot Module Replacement (HMR)
pnpm dev

# Construir la aplicación para producción
pnpm build
```

---

## Uso
La aplicación se divide en tres flujos principales:

1. **Sitio Público**: Accesible al cargar la aplicación. Permite a los usuarios navegar por las propiedades destacadas y enviar consultas.
2. **Autenticación**: Vista de acceso para el personal administrativo mediante el botón "Panel" en la navegación superior.
3. **Gestión Administrativa**: Una vez autenticado, el usuario accede al Dashboard donde puede:
   - Visualizar un resumen (Overview) de la actividad.
   - Listar, buscar y filtrar propiedades existentes.
   - Registrar nuevas propiedades o editar las actuales.
   - Configurar el perfil del agente inmobiliario.

---

## Estructura del Proyecto
```text
real-state-website/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── ui/             # Componentes de UI reutilizables (Radix/Tailwind)
│   │   │   ├── DashboardShell.tsx
│   │   │   ├── PublicSite.tsx
│   │   │   └── ...
│   │   └── App.tsx             # Punto de entrada y gestión de vistas
│   ├── i18n/
│   │   ├── locales/            # Archivos de traducción (en/es)
│   │   └── i18n.ts             # Configuración de i18next
│   ├── styles/                 # Configuraciones de Tailwind y CSS global
│   └── main.tsx                # Renderizado de la aplicación
├── package.json
├── vite.config.ts
└── pnpm-workspace.yaml
```
