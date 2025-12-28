# HelpingHand - Virgin Islands Provider Directory

A comprehensive provider directory application for the Virgin Islands, built as a monorepo with a React frontend, Express.js API, and PostgreSQL database. This platform allows users to discover and connect with local service providers, while providing tools for providers to manage their listings and administrators to oversee the system.

**✨ Featured: Minimum Viable Governance (MVG) System + Premium Trial System** - Complete admin governance with audit trails, dispute management, report triage, and emergency mode. All admin actions are reversible and logged for full accountability (54/54 tests passing ✅). Premium trial system provides 30-day automatic trials with ranking boosts and transparent status indicators (20/20 frontend tests passing ✅).

## Features

### For Users
- **Browse Providers**: Search and filter providers by category, island, area, availability, and status
- **Provider Details**: View detailed profiles including contact information and services
- **Real-time Availability**: Check provider availability status (Today, Next 3 Days, This Week, etc.)
- **Report Listings**: Submit reports for inappropriate or outdated provider information

### For Providers
- **Onboarding**: Easy registration and profile setup process
- **Dashboard**: Manage profile, update availability, and track activity
- **Contact Preferences**: Enable/disable call, WhatsApp, SMS, and set preferred contact method
- **Service Areas**: Multi-select service areas within provider's island
- **Work Information**: Set typical hours and emergency call acceptance
- **Plan Management**: Choose between FREE and PREMIUM plans with automatic 30-day trial periods for new providers
- **Activity Tracking**: Automatic logging of provider interactions and updates

### For Administrators
- **Admin Panel**: Secure login with key-based authentication
- **Provider Management**: View, verify, archive, and manage all provider listings
- **Dispute Management**: Mark/unmark providers as disputed (admin-only visibility)
- **Report Triage**: Review and manage user-submitted reports with status workflow
- **Emergency Mode**: Toggle emergency mode affecting provider ranking and public banner
- **Audit Logging**: Complete audit trail of all admin actions with actor identification
- **System Monitoring**: Access to provider statistics and system health

### Additional Features
- **Smart Ranking**: Providers are ranked based on verification badges, activity, premium status, and trial eligibility
- **Trust System**: Behavior-based provider lifecycle management with activity tracking and automated status updates (fully tested ✅)
- **Governance System**: Complete admin governance with audit trails, dispute management, and emergency mode (fully tested ✅)
- **Authentication**: Secure email/password authentication with Firebase Auth integration (optional)
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS
- **Type Safety**: Full TypeScript implementation for reliability
- **Database Migrations**: Structured schema evolution with SQL migrations and seeds

## Tech Stack

### Frontend (apps/web)
- **React 18** with Vite for fast development
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Router** for client-side routing
- **ESLint** for code quality

### Backend (apps/api)
- **Node.js** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** with pg library
- **CORS** for cross-origin requests
- **dotenv** for environment management

### Database
- **PostgreSQL 15** with Docker containerization
- **Custom Enums** for status and badge types
- **Indexes** for performance optimization
- **Migrations and Seeds** for schema management

### Development Tools
- **pnpm** for package management
- **Docker Compose** for database setup
- **Jest** for testing (API)
- **Prettier** for code formatting

## Project Structure

```
helpinghand/
├── apps/
│   ├── web/                 # React frontend application
│   │   ├── src/
│   │   │   ├── components/  # Reusable UI components
│   │   │   ├── pages/       # Page components
│   │   │   └── main.tsx     # Application entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── api/                 # Express.js backend API
│       ├── src/
│       │   └── server.ts    # Main server file
│       ├── database/        # Database migrations and seeds
│       │   ├── migrations/  # SQL migration files
│       │   └── seeds/       # Database seed files
│       ├── package.json
│       └── tsconfig.json
├── docker-compose.yml       # Database container configuration
├── package.json             # Root package.json with workspaces
├── pnpm-workspace.yaml      # pnpm workspace configuration
├── .eslintrc.js             # ESLint configuration
└── README.md
```

## Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** (v8 or higher)
- **Docker** and Docker Compose
- **Git**
- **Firebase Account** (optional, for professional authentication)

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd helpinghand
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   Create `.env` file in `apps/api/`:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/virgin_islands_providers
   ADMIN_PASSWORD=your-secure-admin-password
   ADMIN_KEY=your-secure-admin-key
   PORT=3000
   ```

4. **Set up Firebase Authentication (Optional):**
   For professional authentication with email/password and automatic email handling:
   
   a. **Create Firebase Project:**
      - Go to [Firebase Console](https://console.firebase.google.com/)
      - Create a new project called "HelpingHandVI"
      - Enable Authentication service and Email/Password sign-in method
   
   b. **Install Firebase SDK:**
      ```bash
      cd apps/web
      npm install firebase
      ```
   
   c. **Configure Firebase:**
      - In Firebase Console, go to Project Settings > General
      - Scroll to "Your apps" and click "Add app" > Web app
      - Copy the Firebase config object
      - Update `.env` in the root directory with your Firebase values:
      ```env
      VITE_USE_FIREBASE_AUTH=true
      VITE_FIREBASE_API_KEY=your-firebase-api-key
      VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
      VITE_FIREBASE_PROJECT_ID=your-project-id
      VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
      VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
      VITE_FIREBASE_APP_ID=your-app-id
      ```
   
   d. **Email Service Setup (Optional):**
      For production email delivery, configure one of:
      - **SendGrid**: Set `EMAIL_PROVIDER=sendgrid` and `SENDGRID_API_KEY=your-key`
      - **AWS SES**: Set `EMAIL_PROVIDER=aws-ses` and AWS credentials
      - **Console**: Default for development (logs to console)

## Database Setup

1. **Start PostgreSQL container:**
   ```bash
   docker-compose up -d
   ```

2. **Run database migrations:**
   ```bash
   # From the api directory
   cd apps/api
   cat database/migrations/001_create_enums.sql | docker exec -i postgres-db psql -U postgres -d virgin_islands_providers
   cat database/migrations/002_create_tables.sql | docker exec -i postgres-db psql -U postgres -d virgin_islands_providers
   cat database/migrations/003_create_indexes.sql | docker exec -i postgres-db psql -U postgres -d virgin_islands_providers
   cat database/migrations/004_add_archived_to_providers.sql | docker exec -i postgres-db psql -U postgres -d virgin_islands_providers
   cat database/migrations/005_add_plan_to_providers.sql | docker exec -i postgres -d virgin_islands_providers
   cat database/migrations/006_create_reports_table.sql | docker exec -i postgres-db psql -U postgres -d virgin_islands_providers
   cat database/migrations/007_add_trust_system.sql | docker exec -i postgres-db psql -U postgres -d virgin_islands_providers
   cat database/migrations/008_add_trust_indexes.sql | docker exec -i postgres-db psql -U postgres -d virgin_islands_providers
   cat database/migrations/009_add_contact_preferences.sql | docker exec -i postgres-db psql -U postgres -d virgin_islands_providers
   cat database/migrations/010_add_admin_governance.sql | docker exec -i postgres-db psql -U postgres -d virgin_islands_providers
   cat database/migrations/011_add_plan_source.sql | docker exec -i postgres-db psql -U postgres -d virgin_islands_providers
   ```

3. **Seed the database:**
   ```bash
   cat database/seeds/001_seed_categories.sql | docker exec -i postgres-db psql -U postgres -d virgin_islands_providers
   cat database/seeds/002_seed_areas.sql | docker exec -i postgres-db psql -U postgres -d virgin_islands_providers
   cat database/seeds/003_seed_providers.sql | docker exec -i postgres-db psql -U postgres -d virgin_islands_providers
   ```

## Running the Application

1. **Start the API server:**
   ```bash
   pnpm --filter api dev
   ```
   The API will be available at `http://localhost:3000`

2. **Start the web application:**
   ```bash
   pnpm --filter web dev
   ```
   The web app will be available at `http://localhost:5173`

3. **Access the application:**
   - Main site: `http://localhost:5173`
   - Admin panel: `http://localhost:5173/admin` (redirects to login)

## API Endpoints

### Public Endpoints
- `GET /health` - Health check
- `GET /providers` - List providers with filtering
- `GET /providers/:id` - Get provider details

### Provider Endpoints
- `POST /providers` - Create new provider
- `PUT /providers/:id` - Update provider profile
- `PUT /providers/:id/status` - Update availability status

### Admin Endpoints (require X-Admin-Key header)
- Authentication: Admin login uses local password validation
- API calls require `X-ADMIN-KEY` header for backend authentication
- `GET /admin/providers` - List all providers
- `PUT /admin/providers/:id/verify` - Verify provider
- `PUT /admin/providers/:id/archive` - Archive/unarchive provider (toggle)
- `PATCH /admin/providers/:id/disputed` - Mark/unmark provider as disputed
- `GET /admin/reports` - List reports with status filtering
- `PATCH /admin/reports/:id` - Update report status and admin notes
- `GET /admin/emergency-mode` - Get emergency mode status
- `PUT /admin/emergency-mode` - Toggle emergency mode
- `POST /admin/jobs/expire-trials` - Expire premium trials and downgrade providers
- `GET /admin/audit-log` - View audit log (future endpoint)

### Reporting
- `POST /reports` - Submit a report

## Usage

### For Users
1. Visit the main site to browse providers
2. Use filters to find specific services or locations
3. Click on providers to view details and contact information
4. Report any issues with provider listings

### For Providers
1. Click "Join" to create a provider account
2. Complete your profile with services and contact information
3. Use the dashboard to update availability and manage your listing
4. Upgrade to premium for enhanced visibility

### For Administrators
1. Access `/admin` and login with admin credentials
2. Review provider listings and verify legitimate businesses
4. Mark/unmark providers as disputed for admin-only visibility
5. Triage user reports with NEW/IN_REVIEW/RESOLVED status workflow
6. Toggle emergency mode to boost trusted provider rankings and show public banner
7. Monitor all admin actions through comprehensive audit logging
8. Take appropriate actions with full accountability and reversibility

## Development

### Code Quality
- Run TypeScript checks: `pnpm --filter web run check` or `pnpm --filter api run check`
- Lint code: `pnpm --filter web run lint` or `pnpm --filter api run lint`
- Format code: `pnpm format`

### Testing
- API tests: `pnpm --filter api test` (52/52 tests passing ✅)
- Web tests: `pnpm --filter web test` (163+ tests with comprehensive coverage ✅)
- **Total Coverage**: 99%+ coverage achieved across all major components and pages

### Building for Production
```bash
pnpm --filter web build
pnpm --filter api build
```

## Database Schema

### Key Tables
- **providers**: Main provider information with dispute status
- **categories**: Service categories
- **areas**: Geographic areas (islands)
- **badges**: Verification badges
- **reports**: User-submitted reports with status and admin notes
- **activity_events**: Provider activity tracking
- **admin_audit_log**: Complete audit trail of all admin actions
- **app_settings**: Application configuration (emergency mode)

### Enums
- **availability_status**: TODAY, NEXT_3_DAYS, THIS_WEEK, NEXT_WEEK, UNAVAILABLE
- **verification_badge**: VERIFIED, EMERGENCY_READY, GOV_APPROVED
- **admin_action_type**: VERIFY, ARCHIVE, UNARCHIVE, MARK_DISPUTED, UNMARK_DISPUTED, REPORT_STATUS_CHANGED, EMERGENCY_MODE_TOGGLED
- **report_status**: NEW, IN_REVIEW, RESOLVED

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and run tests
4. Commit your changes: `git commit -am 'Add some feature'`
5. Push to the branch: `git push origin feature/your-feature`
6. Submit a pull request

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and updates.