# AGENTS Instructions

## Testing

Para validar que un módulo compila correctamente ejecuta en su directorio:

```
npm install && npm run build
```

Si el módulo depende de otro módulo local (`@zumito-team/file-manager`, etc.), usa `npm link`:

```
cd <dep-module> && npm link
cd <target-module> && npm link @zumito-team/<dep-module> && npm install && npm run build
```

## Convenciones

### zumito-framework como peerDependency

Los módulos que solo necesitan tipos del framework (porque el runtime lo provee el bot host) deben declarar `zumito-framework` como `peerDependencies` + `devDependencies`, **no** como `dependency`:

```json
{
  "peerDependencies": {
    "zumito-framework": "^1.14.2"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "zumito-framework": "^1.14.2"
  }
}
```

Esto evita instalar el framework por duplicado. Solo ponlo en `dependencies` si el módulo realmente importa y ejecuta código del framework que no estaría disponible en el contenedor del bot.

### TypeScript constructor parameter properties

Usa `private readonly` inline en el constructor en lugar de declarar la propiedad por separado y asignarla en el cuerpo:

```ts
// CORRECTO
constructor(
    private readonly framework: ZumitoFramework,
    private readonly someOption: string,
) {}

// INCORRECTO
private framework: ZumitoFramework;
private someOption: string;

constructor(framework: ZumitoFramework, someOption: string) {
    this.framework = framework;
    this.someOption = someOption;
}
```

Para dependencias de `ServiceContainer.get()` usa valor por defecto:

```ts
constructor(
    private readonly errorHandler: ErrorHandler = ServiceContainer.get(ErrorHandler),
) {}
```

Solo usa el patrón de declaración + cuerpo cuando la inicialización requiere lógica adicional (condicionales, llamadas a métodos, `super()`).

### Estructura de un módulo

```
module-name/
├── index.ts              # Entry point: exporta la clase Module + re-exports
├── package.json          # @zumito-team/<name>, "type": "module"
├── tsconfig.json         # target ES2020, module ES2020, moduleResolution Bundler
├── README.md             # Instalación, uso como módulo Zumito, configuración
├── commands/             # Clases Command
├── services/             # Clases de servicio (ServiceContainer)
├── routes/               # Clases Route
├── definitions/          # Interfaces y tipos
├── models/               # Modelos de base de datos (@Collection, @Field)
├── translations/         # Archivos JSON de traducción (en.json, es.json)
├── views/                # Plantillas EJS
└── assets/               # Assets estáticos
```

Cada módulo incluye solo los directorios que necesita.

### package.json

```json
{
  "name": "@zumito-team/<nombre>",
  "version": "1.0.0",
  "main": "index.js",
  "types": "index.d.ts",
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.json"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "Bundler",
    "outDir": ".",
    "rootDir": ".",
    "declaration": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "strict": false
  },
  "include": ["**/*.ts"],
  "exclude": ["dist", "node_modules"]
}
```

### index.ts

Exporta la clase Module (extendiendo `Module` de `zumito-framework`) y re-exporta servicios, tipos y rutas públicas. Los imports relativos en TypeScript siempre usan extensión `.js`:

```ts
import { Module } from 'zumito-framework';
import { MyService } from './services/MyService.js';

export class MyModule extends Module {
    constructor(config?: MyConfig) {
        super(import.meta.url);
        ServiceContainer.addService(MyService, [], true, new MyService(config));
    }
}

export { MyService } from './services/MyService.js';
```

### README.md

Todo módulo debe tener README con:
- Descripción breve
- Instalación (`npm install @zumito-team/<name>`)
- Sección "Como módulo de Zumito" con ejemplo de `zumito.config.ts`
- Tabla de configuración con campos, tipos y si son requeridos
