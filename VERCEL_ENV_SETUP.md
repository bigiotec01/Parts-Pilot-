# 🚀 Configurar Variables de Entorno en Vercel

## Pasos para agregar las variables en Vercel Dashboard:

1. **Abre Vercel Dashboard:**
   - Ve a: https://vercel.com/dashboard

2. **Selecciona el proyecto `parts-pilot`**

3. **Ve a Settings → Environment Variables**

4. **Agrega cada variable:**

   > Asegúrate de que el **valor sea solo el valor real**, no incluya el nombre de la variable. Por ejemplo, el campo `Value` debe ser `AIzaSyAW...`, no `VITE_FIREBASE_API_KEY=AIzaSyAW...`.

   ```
   Name: VITE_FIREBASE_API_KEY
   Value: AIzaSyAWmTOV17ojzGOxi6RSLEzf46zFiPktyjo
   Environments: Production, Preview, Development
   ```

   ```
   Name: VITE_FIREBASE_AUTH_DOMAIN
   Value: partspilot-ec37a.firebaseapp.com
   Environments: Production, Preview, Development
   ```

   ```
   Name: VITE_FIREBASE_PROJECT_ID
   Value: partspilot-ec37a
   Environments: Production, Preview, Development
   ```

   ```
   Name: VITE_FIREBASE_STORAGE_BUCKET
   Value: partspilot-ec37a.firebasestorage.app
   Environments: Production, Preview, Development
   ```

   ```
   Name: VITE_FIREBASE_MESSAGING_SENDER_ID
   Value: 956365583546
   Environments: Production, Preview, Development
   ```

   ```
   Name: VITE_FIREBASE_APP_ID
   Value: 1:956365583546:web:8345158e5faa7ad44fbe83
   Environments: Production, Preview, Development
   ```

5. **Después de agregar todas las variables, Vercel redesplegará automáticamente**

6. **Espera a que el nuevo deployment se complete** (puedes ver el progreso en el dashboard)

7. **Recarga la app:** https://parts-pilot-six.vercel.app/

---

## ¿Problema con Vercel CLI?

Si quieres usar línea de comandos en el futuro:

```bash
# 1. Autenticarse
vercel login

# 2. Vincular proyecto
cd c:\Users\bigio\OneDrive\Desktop\Proyectos\ PWA\parts-pilot
vercel link

# 3. Ver variables
vercel env ls

# 4. Agregar variable (opcional)
vercel env add VITE_FIREBASE_API_KEY
# Luego ingresa el valor cuando se pida
```

---

## Verificación

Una vez completado, deberías ver:
- ✅ Las 6 variables de entorno en Vercel Dashboard
- ✅ Un nuevo deployment en progreso
- ✅ El login funcionando sin errores de API
