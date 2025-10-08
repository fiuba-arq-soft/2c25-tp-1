# 3. Arquitectura base
## 3.1 Análisis de la influencia de decisiones de diseño en los QA's
En la presente sección se explorarán las decisiones de diseño identificadas en la arquitectura base y a su impacto sobre los atrbutos de calidad estudiados.

## 3.1.1 Incorporación del stack de monitoreo cAdvisor + Artillery + StatsD + Graphite + Grafana

El sistema actual presenta un stack de observabilidad para medir, almacenar y visualizar métricas en tiempo real. En concreto:
- cAdvisor: mide métricas de contenedores (CPU, memoria, etc.).

- Artillery: genera carga (testing de rendimiento).

- StatsD + Graphite: recolectan y almacenan métricas.

- Grafana: visualiza las métricas.

Esta decisión implicó agregar tres nuevos contenedores, configuraciones adicionales, puertos, conexiones en red internas de Docker y dependencias entre servicios, lo cual impactó de diferentes formas a distintos *stakeholders*.

---

### Impactos identificados

- **Carga cognitiva alta:**  
  Implicó que desarrolladores y arquitectos del sistema deban comprender cómo se conectan las herramientas, qué hace cada una y cómo interpretar los datos generados.  
  Esto impacta la **usabilidad interna** (para el desarrollador), la **manejabilidad** y la **simplicidad** del sistema, que originalmente se componía solo de un backend y un proxy inverso (Nginx).

- **Complejidad operativa:**  
  Más contenedores implican más puertos, configuraciones y *logs* extensos (en particular en el entorno local del trabajo práctico), lo cual aumenta el esfuerzo de *debugging* y de gestión general.  
  Esto afecta negativamente la **manejabilidad**, dado que se incrementa la complejidad operativa y el tiempo requerido para mantener el sistema.

- **Evaluación y visibilidad del comportamiento del sistema:**  
  Cuando el stack se encuentra correctamente configurado, las métricas permiten monitorear el rendimiento, detectar cuellos de botella y observar cómo interactúan los distintos componentes.  
  Esto mejora la **visibilidad** del sistema y favorece la **confiabilidad**, ya que permite anticipar fallos o anomalías de comportamiento.  
  No obstante, la dependencia entre múltiples herramientas introduce el riesgo de obtener una visibilidad incompleta si alguno de los servicios del stack (por ejemplo, Graphite o StatsD) deja de funcionar.

- **Afectación a la disponibilidad:**  
  El aumento en la cantidad de servicios dependientes implica más puntos de falla. Si Graphite o StatsD se detienen, Grafana dejará de mostrar información actualizada.  
  Además, el tiempo de despliegue y recuperación ante fallos se incrementa, afectando la **disponibilidad** de manera negativa, sobre todo en entornos locales.

- **Apoyo a la testeabilidad y diagnóstico:**  
  El stack de monitoreo potencia la capacidad de análisis durante pruebas de rendimiento (por ejemplo, al utilizar Artillery y observar las métricas en Grafana).  
  Esto facilita la identificación de comportamientos anómalos y la validación de la estabilidad del sistema, mejorando la **testeabilidad**.  
  Sin embargo, la infraestructura adicional necesaria para habilitar el monitoreo también introduce complejidad en el entorno de prueba, lo que puede dificultar la reproducibilidad y el control de los experimentos.

- **Seguridad y aislamiento:**  
  Añadir más servicios amplía la superficie de ataque, ya que cada contenedor es un proceso escuchando en distintos puertos internos.  
  Esto impacta la **seguridad operativa**, aunque su efecto sea poco relevante en entornos locales de desarrollo.

- **Impacto en la portabilidad del sistema:**  
  La cintainerización permite desplegar el stack completo en distintos entornos con relativa facilidad, lo cual favorece la **portabilidad técnica**.  
  Sin embargo, la fuerte interdependencia entre servicios y las configuraciones específicas de red, puertos y volúmenes reducen la **portabilidad práctica**, dado que pequeñas diferencias en la infraestructura pueden afectar el funcionamiento o requerir ajustes manuales.

- **Interoperabilidad y acoplamiento tecnológico:**  
  El uso de protocolos y herramientas estandarizadas (UDP, HTTP, Grafana, StatsD) favorece la **interoperabilidad** del sistema, tanto entre sus propios componentes como con futuras herramientas externas de monitoreo.  


## 3.1.2 Impactos del modelo de persistencia elegido

El modelo de persistencia implementado en el sistema consiste en mantener en memoria el estado de los datos y, periódicamente, volcar dicho estado a archivos JSON almacenados localmente en la carpeta `~/state/`. Esto implica que la persistencia está acoplada directamente a la instancia del servidor —es decir, se trata de un sistema **stateful**—, lo que conlleva una serie de consecuencias relevantes sobre diversos atributos de calidad.

- **Acoplamiento con la instancia del servidor:**  
  Al vincular el estado con una única instancia, las sesiones de usuario y los datos persistentes no pueden compartirse entre instancias. Esto impide la **escalabilidad horizontal**, dado que cada réplica tendría su propio estado local no sincronizado. Implementar una gestión de estado distribuido requeriría una infraestructura adicional (por ejemplo, una base de datos externa o un servicio de caché compartido).

- **Impacto en la disponibilidad y rendimiento percibido:**  
  La existencia de una única instancia con estado convierte al backend en un **punto único de falla**. Si el servidor se detiene, todas las sesiones activas se pierden y no pueden ser recuperadas por otra instancia. Esto afecta la **disponibilidad** y la **experiencia del usuario**, ya que aumenta la percepción de fallas y degradación del rendimiento.

- **Problemas de concurrencia:**  
  Al utilizar el sistema de archivos local como medio de persistencia, se introducen **condiciones de carrera** durante operaciones de lectura y escritura concurrentes. El modelo de concurrencia de Node.js (basado en asincronía) no resulta suficiente para garantizar consistencia, dado que el file system no ofrece bloqueo ni sincronización de accesos concurrentes. Esto impacta negativamente la **confiabilidad** y la **consistencia de datos**.

- **Ausencia de soporte transaccional:**  
  El modelo carece de transacciones, por lo que las operaciones no son atómicas ni recuperables ante fallos. En caso de interrupciones durante la escritura, el sistema puede quedar en estados inconsistentes o requerir restauraciones manuales. Esto degrada tanto la **disponibilidad** como la **recuperabilidad**.

- **Pérdida de integridad de datos:**  
  La falta de atomicidad en las operaciones puede dejar al sistema en estados inválidos (por ejemplo, inconsistencias en saldos o cantidades totales). En consecuencia, la **integridad** del sistema se ve directamente comprometida.

- **Incompatibilidad con balanceo de carga:**  
  Dado que el modelo de persistencia no soporta replicación, la existencia de un balanceador de carga (como Nginx) se vuelve una decisión cuestionable. No existen múltiples backends entre los cuales distribuir tráfico, y el balanceador introduce una capa de comunicación adicional que **degrada el rendimiento** sin aportar beneficios reales.  

En conjunto, este modelo de persistencia afecta negativamente la **disponibilidad**, la **escalabilidad**, la **integridad** y la **mantenibilidad**, al tiempo que incrementa la **complejidad operativa** y el riesgo de errores durante la evolución del sistema.

---

## 3.1.3 Instancias únicas de cada servicio

El sistema fue diseñado de manera que cada servicio (API, proxy inverso Nginx, almacenamiento local, etc.) cuenta con una única instancia activa. Esta decisión genera **múltiples puntos únicos de falla** y limita severamente la capacidad del sistema para mantener su operación ante fallos parciales.

- Si cualquiera de estos servicios se detiene, el sistema completo se vuelve **indisponible**, afectando directamente la **disponibilidad** y la **tolerancia a fallos**.  
- La ausencia de mecanismos automáticos de recuperación o reinicio (como *health checks*, *watchdogs* o políticas de *restart* configuradas en Docker) agrava el impacto de las fallas, ya que se requiere intervención manual para restablecer el servicio.  
- Tampoco existen estrategias de **replicación**, **balanceo** ni **redundancia**, lo que hace imposible sostener niveles de servicio adecuados bajo carga o ante degradación de componentes.  

Esta configuración puede ser suficiente para entornos de desarrollo o demostración, pero resulta **inadecuada para entornos de producción**, donde la **disponibilidad**, **resiliencia** y **recuperabilidad** son atributos esenciales.

---

## 3.1.4 Ausencia de un patrón de arquitectura interna

El sistema carece de un patrón de arquitectura claramente definido a nivel interno (por ejemplo, MVC, capas o microservicios), lo cual genera una estructura **monolítica y fuertemente acoplada**. Esta decisión afecta negativamente atributos clave del sistema relacionados con su evolución y mantenibilidad.

- **Dificultad para modificar o extender funcionalidades:**  
  La ausencia de separación de responsabilidades y de interfaces desacopladas complica la incorporación de nuevas funcionalidades (**extensibilidad**) o la modificación segura de las existentes (**modificabilidad**).  

- **Incremento en la complejidad del código:**  
  La lógica de negocio, de presentación y de persistencia tienden a mezclarse, lo que eleva la **complejidad cognitiva** y el riesgo de introducir errores.  

- **Falta de testabilidad:**  
  Al no existir módulos claramente delimitados, las pruebas unitarias o de integración se vuelven difíciles de implementar, afectando la **testeabilidad** del sistema.  

- **Escasa capacidad de evolución:**  
  La arquitectura monolítica limita la posibilidad de migrar gradualmente a tecnologías más modernas o de reestructurar componentes de forma incremental.  

En conjunto, esta ausencia de estructura arquitectónica limita la **mantenibilidad**, **evolutividad**, **testeabilidad** y **extensibilidad**, dificultando la gestión del ciclo de vida del software.






