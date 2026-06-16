# Script para crear usuarios en Firebase Authentication
# Requiere: curl

$projectId = "partspilot-ec37a"
$apiKey = "AIzaSyDo_LvXSW-nT4KJ3d5z_fzqKk2yZ8Kq-pA"  # Tu API Key de Firebase

$usuarios = @(
    @{
        email = "ismael.bigio@gmail.com"
        password = "Admin@123456"
        displayName = "Ismael Bigío"
        role = "admin"
    },
    @{
        email = "gonzalez@example.com"
        password = "Taller@123456"
        displayName = "Juan González"
        role = "taller"
    },
    @{
        email = "elrapido@example.com"
        password = "Taller@123456"
        displayName = "Pedro Martínez"
        role = "taller"
    }
)

function Create-FirebaseUser {
    param(
        [string]$email,
        [string]$password,
        [string]$displayName
    )
    
    $body = @{
        email = $email
        password = $password
        returnSecureToken = $true
        displayName = $displayName
    } | ConvertTo-Json

    $url = "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$apiKey"
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method Post -Body $body -ContentType "application/json"
        $data = $response.Content | ConvertFrom-Json
        return $data.localId
    }
    catch {
        $errorBody = $_.Exception.Response.Content.ToString() | ConvertFrom-Json
        throw $errorBody.error.message
    }
}

Write-Host "🚀 Creando usuarios en Firebase..." -ForegroundColor Green
Write-Host ""

foreach ($user in $usuarios) {
    try {
        Write-Host "📝 Creando usuario: $($user.email)" -ForegroundColor Yellow
        $uid = Create-FirebaseUser -email $user.email -password $user.password -displayName $user.displayName
        Write-Host "✅ Usuario creado con UID: $uid" -ForegroundColor Green
        
        # Aquí irían las llamadas a Firestore para crear el documento
        # pero por ahora solo creamos el usuario de autenticación
        Write-Host ""
    }
    catch {
        if ($_ -like "*EMAIL_EXISTS*") {
            Write-Host "⚠️  El usuario $($user.email) ya existe" -ForegroundColor Yellow
        }
        else {
            Write-Host "❌ Error: $_" -ForegroundColor Red
        }
        Write-Host ""
    }
}

Write-Host "✅ Proceso completado" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Credenciales para probar:" -ForegroundColor Cyan
foreach ($user in $usuarios) {
    Write-Host "  $($user.email) / $($user.password)" -ForegroundColor White
}
