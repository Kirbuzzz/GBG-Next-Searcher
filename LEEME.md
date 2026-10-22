# Servidor del buscador de niveles (Game Builder Garage)
Idea de Kirbus

Cualquiera puede añadir niveles sin cuenta. Los demás los ven al momento (la página se actualiza cada 30 s).

## Probar en tu PC
    ADMIN_KEY=mi-clave node server.js
Abre http://localhost:3000 (necesitas Node 18 o superior; no hay dependencias que instalar).

## Subirlo a Render (paso a paso)
1. Crea un repositorio en GitHub y sube todo el contenido de esta carpeta.
2. En render.com: New > Web Service > elige tu repositorio.
3. Runtime: Node. Build Command: (vacío). Start Command: `npm start`.
4. En Environment añade `ADMIN_KEY` con una clave larga que solo sepas tú.
5. Deploy. Render te da una URL pública: compártela.

## Importante: que no se pierdan los niveles
En el plan gratuito de Render el disco se borra al reiniciar o redesplegar. Para guardar los niveles:
- Añade un Disk (de pago) montado en `/var/data` y pon la variable `DATA_DIR=/var/data`; o
- Usa Railway o Fly.io con volumen persistente (mismo `DATA_DIR`); o
- Usa un VPS propio.
Haz copias de `levels.json` de vez en cuando.

## Moderar (borrar niveles)
Abre tu página con tu clave en la dirección: `https://TU-URL/#admin=TU_CLAVE`
Aparece una × roja en cada nivel. La clave solo se usa en tu navegador y no se guarda.

## Protecciones incluidas
- Máximo 5 niveles por IP cada 10 minutos (la IP se usa solo en memoria para eso, no se guarda).
- El ID debe tener formato válido (G 003 4WG NHV) y no se permiten IDs duplicados.
- Textos limpios y con longitud máxima; cuerpo de petición limitado a 2 KB.
- Sin ADMIN_KEY nadie puede borrar.

## Archivos
- server.js: servidor y API (GET/POST /api/levels, DELETE /api/levels/:id)
- public/index.html: la página
- seed.json: los 11 niveles iniciales (se cargan solo la primera vez)
