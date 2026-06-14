# 💰 Shared Expenses App

Aplicație mobilă pentru Android care permite evidența și gestionarea cheltuielilor între 2 utilizatori în timp real.

## ✨ Funcționalități

- ✅ **Autentificare sigură** cu email și parolă (Firebase)
- ✅ **Sincronizare în timp real** între 2 dispozitive
- ✅ **Gestionare sold** - setare suma inițială și tracked retragerilor
- ✅ **Istoric complet** al tranzacțiilor cu timestamp
- ✅ **Interfață intuitivă** și ușor de folosit
- ✅ **Notificări live** - vezi instant ce face celălalt utilizator

## 🚀 Setup

### 1. Cerințe
- Node.js 16+
- npm sau yarn
- Android Studio (pentru emulator)
- Cont Firebase

### 2. Instalare

```bash
# Clone the repository
git clone https://github.com/AOvidiu81/shared-repositori-app.git
cd shared-repositori-app

# Install dependencies
npm install

# Instalează Expo CLI
npm install -g expo-cli
```

### 3. Configurare Firebase

1. Mergi pe [Firebase Console](https://console.firebase.google.com/)
2. Creează un nou proiect: `shared-expenses-app`
3. Activează:
   - **Authentication** → Email/Password
   - **Realtime Database** (test mode la început)
4. Copiază configurația din Project Settings
5. Editează `src/config/firebase.js` și înlocuiește valorile:

```javascript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. Reguli Firebase Database

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "sessions": {
      "$sessionId": {
        ".read": true,
        ".write": true
      }
    },
    "invitations": {
      "$email": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

### 5. Pornire aplicație

```bash
# Pentru Android
npm run android

# Sau pentru a porni server Expo
npm start
```

## 📱 Cum se folosește

### User 1 (Creatorul sesiunii)
1. Se autentifică cu email-ul
2. Va introduce suma inițială (ex: 1000 RON)
3. Va introduce email-ul User 2
4. Se creează sesiunea și se trimite invitație

### User 2
1. Se autentifică cu email-ul
2. Se acceptă invitația (va vedea sesiunea)
3. Ambii utilizatori vor vedea soldul și vor putea face retrrageri

## 🏗️ Structura Proiectului

```
shared-repositori-app/
├── App.js                 # Entry point
├── app.json              # Expo config
├── package.json
├── src/
│   ├── config/
│   │   └── firebase.js    # Firebase configuration
│   └── screens/
│       ├── LoginScreen.js       # Autentificare
│       ├── SetupScreen.js       # Configurare sesiune
│       └── DashboardScreen.js   # Dashboard principal
└── README.md
```

## 🔐 Securitate

- Datele sunt protejate prin autentificare Firebase
- Parolele nu sunt stocate local
- Comunicarea este criptată
- Fiecare utilizator vede doar sesiunile sale

## 📊 Structura Bază de Date

```
users/
  ├── {uid}/
  │   └── session: {sessionId, initialAmount, currentBalance, user1, user2...}

sessions/
  ├── {sessionId}/
  │   ├── initialAmount: 1000
  │   ├── currentBalance: 800
  │   ├── user1: email1@gmail.com
  │   ├── user2: email2@gmail.com
  │   └── transactions/
  │       ├── tx1: {user, amount, timestamp, type}
  │       └── tx2: {user, amount, timestamp, type}

invitations/
  └── {email}/
      └── {from, sessionId, timestamp}
```

## 🐛 Debugging

```bash
# Pornim Expo dev server
npm start

# În Expo app, se deschide dev menu (shake phone)
# Selectez "View logs" pentru debug
```

## 📝 Changelog

### v1.0.0
- ✅ Setup inițial cu autentificare
- ✅ Gestionare sesiuni
- ✅ Sincronizare real-time
- ✅ Istoric tranzacții

## 🤝 Contribuții

Orice pull request este bine venit! Pentru schimbări majore, deschideți un issue mai întâi.

## 📄 Licență

MIT

---

**Creat cu ❤️ pentru gestionarea cheltuielilor**
