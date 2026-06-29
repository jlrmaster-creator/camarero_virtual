# Desarrollo de una Aplicación Web para la Gestión de Mesas de un Bar

## Contexto

Actúa como un **Arquitecto de Software Senior y Full Stack Developer** con amplia experiencia en aplicaciones web responsive, desarrollo Open Source, UX/UI y gestión de proyectos.

Debes diseñar e implementar una aplicación web moderna para la gestión de las mesas de un bar, optimizada para utilizarse principalmente desde un teléfono móvil, aunque también debe funcionar correctamente desde tablets y ordenadores.

La aplicación debe priorizar la rapidez de uso, ya que será utilizada continuamente por camareros durante el servicio.

---

# Objetivo

Desarrollar una aplicación web completa para gestionar la ocupación de las mesas y las comandas de un bar que dispone de:

* 30 mesas interiores.
* 30 mesas exteriores (terraza).

Las mesas interiores y exteriores deben gestionarse de forma independiente mediante pestañas o navegación claramente diferenciada.

---

# Requisitos funcionales

## Gestión de camareros

* Debe existir una gestión de camareros. La aplicación debe llevar la información de cada camarero por separado.

* Una mesa gestionada por un camarero debe aparecer bloqueada/ocupada a otro camarero.

* Al iniciar la aplicación y 'comenzar la jornada' de trabajo, la app debe exigir el nombre o código de camarero. 

* Las mesas gestionadas por un camarero no pueden ser gestionadas por otro.

* En los informes al finalizar la jornada debe aparecer el nombre o código de camarero y las mesas que ha gestionado.

## Gestión de mesas

La aplicación debe permitir:

* Mostrar todas las mesas en formato cuadrícula.
* Diferenciar visualmente:

  * Mesas libres.
  * Mesas ocupadas.
  * Mesas pendientes de cobrar (si se implementa posteriormente).
  * Parcialmente cobradas (se ha cobrado una parte pero han seguido pidiendo mása o ha venido más gente)
  * Cobradas 
* Cambiar rápidamente entre:

  * Interior (ejemplo de numeración: I101, I102, I103...I130)
  * Terraza (ejemplo de numeración: EXT201, EXT202, EXT203...EXT230)

mediante pestañas superiores o un selector muy visible.

Cada mesa será un botón o tarjeta grande para facilitar su uso desde dispositivos móviles.

* Debe poder asignarse mesas a diferentes camareros. Si se hace, cada camarero solo podrá servir / realizar comandas a las mesas que tiene asignadas.

* En una jornada de trabajo, se puede cambiar la asignación de las mesas entre los diferentes camareros. Si se hace, antes del cambio de camarero se debe generar el informe PDF de dichas mesas, obteniendo el importe asociado al camarero que ha trabajado con dichas mesas.

---

## Configuración de mesas

Cada mesa debe tener:

* Número de mesa. 
* Nombre editable.
* Posibilidad de renombrarla desde un panel de configuración.

Ejemplo:

Mesa 1
→ Mesa Ventana

Mesa 12
→ Terraza Norte

Los cambios deben mantenerse guardados.

---

## Información de la mesa

Al pulsar sobre una mesa deberá abrirse una ficha con:

### Información básica

* Número de mesa
* Nombre de la mesa
* Número de comensales
* Estado
* Pedido

---

### Cliente

Campos editables:

* Todos los de la ficha menos el número de mesa

---

### Comanda

Debe existir un campo grande de texto para escribir libremente la nota.

Ejemplos:

3 cervezas

2 Coca-Cola

2 Fanta naranja

3 cafés solos

2 cafés con leche

1 tortilla

etc.

No es necesario un sistema TPV.

Simplemente un área de texto editable.

## Catalogo de productos

Se debe permitir crear un catálogo de productos (producto, importe), ejemplo: Cerveza Con Alcohol, 3 euros, Cocacola, 2,5 euros.

Cuando se cree la comanda y se escriba Cerv... la app debe buscar en el catálogo y mostrar del listado los productos que contengan los caracteres introducidos.

Si el producto no se encuentra en el catálogo, sugerir añadirlo.

---

## Guardado

Los datos deberán guardarse automáticamente sin necesidad de pulsar "Guardar".

Cada cambio debe persistir inmediatamente.

---

## Factura

Cuando los clientes pidan la cuenta, desde la comanda se debe poder generar un PDF tipo ticket con el detalle del pedido, cantidades, productos, importe de cada producto y el total de la comanda.

Debe poder enviarse dicho PDF generado por WhashApp

---

## Informes

Al finalizar la jornada, se debe 'cerrar la caja' y debe generarse un PDF con el total de cada mesa, y la suma total de todas las mesas.

Se debe poder enviar dicho fichero por WhashApp

---

## Eliminación automática de datos

Los datos introducidos en las mesas deberán eliminarse automáticamente transcurridas 48 horas desde su creación.

Ejemplo:

Datos creados el lunes a las 10:00

↓

Se eliminarán el miércoles a las 10:00.

Datos creados el martes

↓

Se eliminarán el jueves.

Cada registro tendrá su propia fecha de expiración.

La limpieza debe realizarse automáticamente sin intervención del usuario.

---

## Reinicio manual

Cada mesa debe disponer de un botón:

"Finalizar servicio", el estado debe ser 'Cobrada' para poder dejarla libre de nuevo

que:

* vacía toda la información
* libera la mesa
* la deja disponible nuevamente.

Debe solicitar confirmación antes de borrar.

La información del total facturado a la mesa debe almacenarse de alguna forma para que al 'cerrar la caja' se sume el total de cada mesa

---

# Estados visuales

Cada mesa debe mostrar colores diferentes.

Por ejemplo:

🟢 Libre

🔴 Ocupada

⚪ Sin información

Los colores deben poder modificarse fácilmente mediante variables CSS.

---

# Responsive

La aplicación debe estar optimizada para:

* móviles Android
* iPhone
* tablets
* escritorio

Debe comportarse como una Progressive Web App (PWA).

Debe poder instalarse como aplicación desde el navegador.

---

# Tecnología

Utilizar exclusivamente tecnologías Open Source.

Stack recomendado:

Frontend

* React
* Vite
* TypeScript

Estilos

* TailwindCSS

Backend

* Node.js
* Express

Base de datos

SQLite en local.

No utilizar servicios cloud.

No depender de Firebase.

No depender de Supabase.

No depender de MongoDB Atlas.

Todo debe funcionar completamente en local.

---

# Base de datos

Diseñar la base de datos correctamente normalizada.

Tablas mínimas:

Mesas

* id
* zona
* numero
* nombre
* estado

Ocupaciones

* id
* mesa_id
* cliente
* comensales
* nota
* fecha_creacion
* fecha_actualizacion
* fecha_expiracion

---

# Limpieza automática

Implementar un proceso automático que:

cada cierto tiempo

compruebe

fecha_expiracion < fecha_actual

y elimine dichos registros.

No debe requerir intervención humana.

---

# Arquitectura

Organizar el proyecto siguiendo buenas prácticas.

Ejemplo:

/client

/components

/pages

/hooks

/services

/context

/types

/server

/routes

/controllers

/models

/database

/utils

/public

---

# Código

Todo el código debe ser:

* modular
* reutilizable
* limpio
* documentado
* tipado con TypeScript
* fácilmente ampliable

Evitar duplicación.

Aplicar principios SOLID cuando sea posible.

---

# Interfaz

Diseño moderno.

Minimalista.

Muy rápido.

Botones grandes.

Tipografía clara.

Mucho contraste.

Modo claro y modo oscuro.

Animaciones suaves.

---

# Seguridad

Validar todos los datos recibidos.

Evitar inyección SQL.

Evitar XSS.

Validar formularios.

---

# Control de versiones

El proyecto debe estar preparado para Git.

Debe incluir:

.gitignore

README.md

LICENSE (MIT)

Convenciones de commits:

feat:

fix:

docs:

refactor:

style:

test:

chore:

---

# README

Generar un README completo con:

Instalación

Dependencias

Cómo ejecutar el proyecto

Cómo ejecutar el backend

Cómo iniciar la base de datos

Cómo realizar el primer despliegue

Cómo crear un ejecutable si se desea

---

# Escalabilidad

La arquitectura debe permitir incorporar en el futuro:

* TPV
* impresión de tickets
* impresión en cocina
* usuarios
* login
* camareros
* historial
* estadísticas
* facturación
* exportación a Excel
* copias de seguridad automáticas
* sincronización entre varios dispositivos de la red local

sin necesidad de rehacer el proyecto.

---

# Calidad esperada

El resultado debe tener calidad profesional, listo para producción.

No generar código provisional ni ejemplos simplificados.

Cada archivo debe estar completo.

Explicar la estructura del proyecto antes de comenzar.

Generar el proyecto paso a paso, indicando el contenido completo de cada archivo, hasta disponer de una aplicación totalmente funcional.
