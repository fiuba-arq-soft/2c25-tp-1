# Trabajo Práctico 1

Repositorio para el desarrollo del informe del Trabajo Práctico

## Configuración del Entorno de Desarrollo

### Opción 1: Usando Devenv (Recomendado)

See [DEVENV.md](DEVENV.md) for detailed instructions on setting up the development environment with devenv.
### Opción 2: Instalación Manual

Si prefieres instalar las dependencias manualmente:

1. Instala un editor que soporte Org Mode (ej. VS Code con extensiones)
2. Instala LaTeX y paquetes necesarios ejecutando:
    ```bash
    ./scripts/install_deps_latex.sh
    ```
## Estructura del Proyecto

- `informe.org`: Archivo principal del informe en formato Org Mode
- `scripts/`: Scripts de Emacs para exportación
- `assets/`: Imágenes, diagramas y recursos
- `org/`: Configuración de temas para Org Mode
- `Makefile`: Comandos para compilar el proyecto

## Trabajando con el Informe

### Editando el Archivo Principal

El archivo `informe.org` contiene todo el contenido del informe. Para editarlo, utiliza cualquier editor de texto que soporte Org Mode (como Emacs o VS Code con extensiones).
### Sintaxis Básica de Org Mode

Para aprender la sintaxis de Org Mode utilizada en este proyecto, consulta el archivo [ejemplos-org-mode.org](ejemplos-org-mode.org) que contiene ejemplos de:

- Encabezados y estructura
- Formato de texto
- Listas y tareas
- Tablas
- Bloques de código
- Diagramas PlantUML
- Exportación LaTeX

## Compilación del Informe

### Compilar a PDF

Para generar el PDF del informe:

```bash
make pdf
```

O directamente:

```bash
make informe.pdf
```

### Compilar a HTML

Para generar la versión HTML:

```bash
make html
```

O directamente:

```bash
make informe.html
```

### Compilar Todo

Para generar tanto PDF como HTML:

```bash
make all
```

### Limpiar Archivos Generados

Para eliminar los archivos generados:

```bash
make clean
```

## Flujo de Trabajo Recomendado

1. **Configura el entorno**: Usa `devenv shell` para activar el entorno
2. **Edita el informe**: Modifica `informe.org` con tu editor preferido
3. **Ejecuta bloques de código**: Si hay diagramas PlantUML o código que generar imágenes
4. **Compila**: Usa `make pdf` para generar el PDF final
5. **Verifica**: Revisa el PDF generado y ajusta según sea necesario

## Diagramas y Gráficos

Este proyecto utiliza PlantUML para generar diagramas automáticamente. Los diagramas se definen como bloques de código en `informe.org`:

```org
#+BEGIN_SRC plantuml :file assets/mi-diagrama.png :exports results
@startuml
component "Mi Componente"
@enduml
#+END_SRC
```

Los diagramas se generan automáticamente durante la compilación.

## Publicación en GitHub Pages

Para publicar la versión HTML en GitHub Pages:

```bash
make github-pages
```

Esto crea un directorio `docs/` con los archivos necesarios.

## Dependencias

### Requeridas
- Editor con soporte para Org Mode (Emacs, VS Code, etc.)
- LaTeX (TeX Live con paquetes adicionales)
- Graphviz (para diagramas DOT)
- PlantUML (para diagramas UML)

### Opcionales
- ImageMagick (para procesamiento de imágenes)
- Pandoc (para conversiones adicionales)

## Solución de Problemas

### Error de LaTeX
Si hay errores durante la compilación a PDF, revisa el archivo `informe.pdf.log` para detalles del error.

### Diagramas no se generan
Asegúrate de que Java esté instalado para PlantUML y que Graphviz esté disponible.

### Tema no se aplica
Verifica que los archivos en `org/` estén correctamente configurados y que las rutas sean correctas.

## Contribución

1. Crea una rama para tus cambios
2. Realiza tus modificaciones en `informe.org`
3. Compila y verifica que todo funciona
4. Crea un commit con tus cambios
5. Envía un pull request

## Referencias

- [Manual de Org Mode](https://orgmode.org/manual/)
- [Guía de PlantUML](https://plantuml.com/)
- [Documentación de LaTeX](https://www.latex-project.org/)
