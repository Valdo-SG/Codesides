# Mis Finanzas

Aplicación de escritorio para llevar el control de tus finanzas personales: cuentas, ingresos, gastos, transferencias, presupuestos por categoría y reportes visuales.

## Stack

- Electron + React + TypeScript
- Vite (`vite-plugin-electron`) para el bundling de renderer/main/preload
- SQLite local (`better-sqlite3`) — los datos se guardan en el directorio de datos de usuario del sistema operativo, no requieren conexión a internet
- `recharts` para los gráficos de reportes

## Funcionalidades

- **Cuentas**: efectivo, banco, tarjeta, ahorro, etc., con saldo inicial y saldo calculado automáticamente.
- **Transacciones**: ingresos, gastos y transferencias entre cuentas, con categoría, fecha y descripción.
- **Presupuestos**: límite mensual por categoría de gasto, con barra de progreso y aviso si te pasás.
- **Reportes**: gasto por categoría (torta) y evolución de ingresos vs. gastos de los últimos 6 meses (barras).

## Cómo correrlo

```bash
npm install
npm run dev
```

Esto levanta Vite y abre la ventana de Electron con hot-reload.

## Build de escritorio

```bash
npm run build   # compila TypeScript + genera el bundle de renderer/main/preload
npm run dist    # además empaqueta el instalador con electron-builder
```

El instalador queda en `release/`.

## Dónde se guardan los datos

Por defecto todo se guarda localmente en un archivo SQLite (`finanzas.db`) dentro del directorio de datos de la app (`app.getPath('userData')`, definido en `electron/main.ts`). No depende de ningún servicio externo para funcionar.

## Sincronización con Google Cloud (pendiente)

Todavía no tenés un proyecto de Google Cloud configurado, así que esta primera versión funciona 100% local. La capa de datos está aislada en `electron/db.ts` detrás de la clase `FinanceRepository`, así que el día que quieras sincronizar con la nube (por ejemplo con Firestore) alcanza con:

1. Crear un proyecto en [Google Cloud Console](https://console.cloud.google.com/) y habilitar Firestore.
2. Generar credenciales (cuenta de servicio o OAuth, según si querés sincronizar en segundo plano o por usuario).
3. Agregar una implementación alternativa de sincronización que replique las operaciones de `FinanceRepository` hacia Firestore (por ejemplo, escribiendo también en la nube después de cada operación local, o corriendo una sincronización periódica).

No hace falta tocar la interfaz (`electron/preload.ts` / `src/types.ts`): la UI no sabe ni le importa de dónde vienen los datos.

## Nota sobre este entorno de desarrollo

Este proyecto se armó en un sandbox sin acceso a `github.com` para binarios grandes, por lo que no se pudo descargar el binario de Electron para abrir la ventana visualmente acá. Sí se verificó:

- `npx tsc --noEmit` sin errores
- `npm run build` genera correctamente `dist/`, `dist-electron/main.js` y `dist-electron/preload.mjs`
- La capa de datos (`electron/db.ts`) fue probada end-to-end (cuentas, transacciones, presupuestos y reportes) con resultados correctos

Para verlo andando, corré `npm install && npm run dev` en tu máquina.
