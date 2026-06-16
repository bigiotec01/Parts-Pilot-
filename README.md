# Parts Pilot 🚗

Portal de pedidos de piezas de carrocería — conecta el departamento de piezas con talleres de hojalatería y pintura.

## Stack
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Hosting:** Vercel (conectado a GitHub, auto-deploy)
- **Base de datos / Auth / Storage:** Firebase (próxima fase)

---

## 🚀 Pasos para poner en producción

### 1. GitHub — subir el código

```bash
# En la carpeta del proyecto
git init
git add .
git commit -m "Initial commit - Parts Pilot v1"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/parts-pilot.git
git push -u origin main
```

### 2. Vercel — publicar la app

1. Entra a https://vercel.com/dashboard
2. Clic en **"Add New Project"**
3. Importa tu repo `parts-pilot` de GitHub
4. Vercel detecta Vite automáticamente — deja los ajustes por defecto
5. Clic en **"Deploy"**
6. En ~60 segundos tienes tu URL pública: `parts-pilot.vercel.app`

> Cada `git push` a la rama `main` redespliega la app automáticamente.

### 3. Firebase — base de datos real (próxima fase)

1. Ve a https://console.firebase.google.com
2. Crea un proyecto llamado `parts-pilot`
3. Activa:
   - **Authentication** → Sign-in method → Email/Password
   - **Firestore Database** → modo producción
   - **Storage** → para fotos y PDFs
4. En Configuración del proyecto → "Tu app" → copia las credenciales
5. Crea un archivo `.env` en la raíz del proyecto:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

6. En Vercel → Settings → Environment Variables → agrega las mismas variables

---

## Desarrollo local

```bash
npm install
npm run dev
```

Abre http://localhost:5173

**Cuentas de demo:**
- Admin: `admin / admin123`
- Taller González: `gonzalez / 1234`
- Taller El Rápido: `elrapido / 1234`
