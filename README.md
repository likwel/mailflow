# MailFlow

Plateforme de gestion et d'envoi d'emails avec une API sécurisée, un système de templates, d'envoi par lot et un tableau de bord complet.

---

## Structure du projet

```
mailflow/
├── frontend/          # React + Vite (port 3000)
├── routes/            # Routes Express (auth, api, dashboard, templates)
├── middleware/        # Middlewares (auth, rate limiter, API key)
├── config/            # Configuration (SMTP, etc.)
├── utils/             # Utilitaires (plan limits, etc.)
├── prisma/
│   ├── schema.prisma  # Schéma de la base de données
│   ├── migrations/    # Migrations générées par Prisma
│   └── seed.js        # Données initiales
├── server.js          # Entry point du backend
├── package.json
└── .env               # Variables d'environnement
```

---

## Prérequis

- **Node.js** >= 20
- **PostgreSQL** >= 14
- **npm** >= 9

---

## Installation de PostgreSQL

### Windows

1. Téléchargez l'installeur depuis [postgresql.org](https://www.postgresql.org/download/windows/)
2. Lancez l'installation, choisissez le port **5432** (par défaut)
3. Notez le mot de passe que vous définissez pour l'utilisateur `postgres`
4. Terminez l'installation

### macOS (Homebrew)

```bash
brew install postgresql@16
brew services start postgresql@16
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'votre_mot_de_passe';"
```

---

## Créer la base de données

Connectez-vous à PostgreSQL et créez la base :

```bash
psql -U postgres -h localhost
```

```sql
CREATE DATABASE mailflow;
\q
```

---

## Configuration du projet

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd mailflow
```

### 2. Installer les dépendances backend

```bash
npm install
```

### 3. Installer les dépendances frontend

```bash
cd frontend
npm install
cd ..
```

### 4. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
# Base de données PostgreSQL
DATABASE_URL=postgresql://postgres:votre_mot_de_passe@localhost:5432/mailflow

# JWT
JWT_SECRET=votre_secret_jwt_aléatoire

# SMTP (optionnel — pour l'envoi réel d'emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre_email@gmail.com
SMTP_PASS=votre_mot_de_passe_app
```

> **Tip :** Pour générer un `JWT_SECRET` aléatoire :
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 5. Générer le client Prisma

```bash
npx prisma generate
```

### 6. Appliquer les migrations

```bash
npx prisma migrate dev
```

Cette commande crée les tables dans votre base PostgreSQL selon le schéma défini dans `prisma/schema.prisma`.

### 7. Seeder la base (optionnel)

```bash
npm run db:seed
```

---

## Lancer le projet

### Développement (backend + frontend simultanément)

```bash
npm run dev
```

| Service    | URL                      |
|------------|--------------------------|
| Backend    | http://localhost:5000     |
| Frontend   | http://localhost:3000     |

### Séparément

```bash
# Backend uniquement
npm run start:backend

# Frontend uniquement
npm run start:frontend
```

---

## Scripts disponibles

| Script              | Description                                        |
|---------------------|----------------------------------------------------|
| `npm run dev`       | Lance le backend et le frontend simultanément      |
| `npm run start:backend`  | Lance uniquement le serveur Express (nodemon) |
| `npm run start:frontend` | Lance uniquement le frontend React (Vite)    |
| `npm run db:migrate`     | Crée une nouvelle migration Prisma           |
| `npm run db:seed`        | Exécute le seeder                            |
| `npm run db:studio`      | Ouvre Prisma Studio (interface visuelle de la DB) |

---

## Prisma Studio

Pour visualiser et modifier les données directement depuis une interface graphique :

```bash
npm run db:studio
```

Ouvre automatiquement sur [http://localhost:5555](http://localhost:5555).

---

## Plans disponibles

| Plan     | Emails / mois |
|----------|---------------|
| FREE     | 100           |
| PRO      | 5 000         |
| BUSINESS | 50 000        |

---

## Licence

MIT