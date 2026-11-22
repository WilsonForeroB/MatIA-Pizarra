# Banco de ejemplos

Esta carpeta guarda los ejemplos que aparecen en la pizarra con el botón **Ejemplos** (al lado de «Historial»).
Sirven para que quien empieza vea lo que puede hacer la pizarra y aprenda cambiándolos.

- No hace falta dar permiso a ninguna carpeta: los ejemplos se cargan solos al abrir `pizarra.html`, en cualquier navegador y sin conexión.
- **Abrir** carga una **copia**: el ejemplo original no se estropea. Para conservar los cambios, «Guardar» o «Historial».
- **Añadir páginas** suma las páginas del ejemplo a la clase que tienes abierta.

## Temas

| `tema` | Se muestra como |
| --- | --- |
| `algebra` | Álgebra |
| `calculo` | Cálculo |
| `graficas` | Gráficas |
| `estadistica` | Estadística y probabilidad |
| `geometria` | Geometría |
| `discreta` | Discreta y lógica |
| `presentaciones` | Presentaciones |

## Añadir un ejemplo

1. Prepara la clase en la pizarra y descárgala con **Archivo → Descargar (.json)** (o cógela de tu carpeta de historial).
2. Crea `ejemplos/<tema>-<nombre>.js` con este contenido y pega el `.json` en `board`:

   ```js
   MatIA.ejemplo({
     id: 'calculo-mi-ejemplo',        // igual que el nombre del fichero, sin .js
     tema: 'calculo',                 // uno de la tabla de arriba
     titulo: 'Mi ejemplo',
     resumen: 'Una frase: qué enseña o qué se puede probar.',
     board: { /* el contenido del .json: title, paper, pages… */ },
   });
   ```

   Consejo: empieza con una línea de texto que diga qué se ve y qué cambiar («Prueba a cambiar…»).
   No uses imágenes: viven en la carpeta de cada persona y no estarían en el ejemplo.
3. Añade su línea en `pizarra.html`, en la zona «Banco de ejemplos»:
   `<script src="ejemplos/calculo-mi-ejemplo.js"></script>`
4. Comprueba que se abre bien y genera su miniatura:

   ```
   node src/tests/ejemplos.js calculo-mi-ejemplo
   node src/tests/ejemplos.js --capturas calculo-mi-ejemplo
   ```

   La miniatura queda en `ejemplos/img/<id>.jpg`. Si no existe, la tarjeta muestra el icono del tema.

El formato de `board` (tipos de bloque y campos) está en [`src/docs/FORMATO-JSON.md`](../src/docs/FORMATO-JSON.md).
