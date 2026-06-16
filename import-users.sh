#!/bin/bash
# Script para importar usuarios a Firebase usando firebase auth:import

cat > users.json << 'EOF'
{
  "users": [
    {
      "localId": "ismael-bigio-uid",
      "email": "ismael.bigio@gmail.com",
      "passwordHash": "Admin@123456",
      "displayName": "Ismael Bigío",
      "salt": "NaCl",
      "customAttributes": "{\"role\":\"admin\"}",
      "createdAt": 1719355200000,
      "lastSignedInAt": 1719355200000
    },
    {
      "localId": "gonzalez-uid",
      "email": "gonzalez@example.com",
      "passwordHash": "Taller@123456",
      "displayName": "Juan González",
      "salt": "NaCl",
      "customAttributes": "{\"role\":\"taller\"}",
      "createdAt": 1719355200000,
      "lastSignedInAt": 1719355200000
    },
    {
      "localId": "elrapido-uid",
      "email": "elrapido@example.com",
      "passwordHash": "Taller@123456",
      "displayName": "Pedro Martínez",
      "salt": "NaCl",
      "customAttributes": "{\"role\":\"taller\"}",
      "createdAt": 1719355200000,
      "lastSignedInAt": 1719355200000
    }
  ]
}
EOF

echo "Importando usuarios..."
firebase auth:import users.json --hash-algo=plaintext --project=partspilot-ec37a
