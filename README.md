# HelpingHand - Virgin Islands Provider Directory

A comprehensive provider directory application for the Virgin Islands, built as a monorepo with a React frontend, Express.js API, and PostgreSQL database. This platform allows users to discover and connect with local service providers, while providing tools for providers to manage their listings and administrators to oversee the system.

**✨ Featured: Trust System** - Complete behavior-based provider lifecycle management with activity tracking, automated status updates, and comprehensive test coverage (47/47 tests passing).

## Features

### For Users
- **Browse Providers**: Search and filter providers by category, island, availability, and status
- **Provider Details**: View detailed profiles including contact information and services
- **Real-time Availability**: Check provider availability status (Today, Next 3 Days, This Week, etc.)
- **Report Listings**: Submit reports for inappropriate or outdated provider information

### For Providers
- **Onboarding**: Easy registration and profile setup process
- **Dashboard**: Manage profile, update availability, and track activity
- **Plan Management**: Choose between FREE and PREMIUM plans with trial periods
- **Activity Tracking**: Automatic logging of provider interactions and updates

### For Administrators
- **Admin Panel**: Secure login with key-based authentication
- **Provider Management**: View, verify, archive, and manage all provider listings
- **Report Handling**: Review and manage user-submitted reports
- **System Monitoring**: Access to provider statistics and system health

### Additional Features
- **Smart Ranking**: Providers are ranked based on verification badges, activity, and premium status
- **Trust System**: Behavior-based provider lifecycle management with activity tracking and automated status updates (fully tested ✅)
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
   ADMIN_PASSWORD=admin123
   ADMIN_KEY=admin-secret
   PORT=3000
   ```

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
   cat database/migrations/005_add_plan_to_providers.sql | docker exec -i postgres-db psql -U postgres -d virgin_islands_providers
   cat database/migrations/006_create_reports_table.sql | docker exec -i postgres-db psql -U postgres -d virgin_islands_providers
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
   - Admin panel: `http://localhost:5173/admin`

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
- `GET /admin/providers` - List all providers
- `PUT /admin/providers/:id/verify` - Verify provider
- `PUT /admin/providers/:id/archive` - Archive provider
- `GET /admin/reports` - List reports

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
3. Handle user reports and take appropriate actions
4. Monitor system statistics

## Development

### Code Quality
- Run TypeScript checks: `pnpm --filter web run check` or `pnpm --filter api run check`
- Lint code: `pnpm --filter web run lint` or `pnpm --filter api run lint`
- Format code: `pnpm format`

### Testing
- API tests: `pnpm --filter api test` (41/41 tests passing ✅)
- Web tests: `pnpm --filter web test` (6/6 tests passing ✅)
- **Total Coverage**: 47/47 tests passing (100% success rate)

### Building for Production
```bash
pnpm --filter web build
pnpm --filter api build
```

## Database Schema

### Key Tables
- **providers**: Main provider information
- **categories**: Service categories
- **areas**: Geographic areas (islands)
- **badges**: Verification badges
- **reports**: User-submitted reports
- **activity_events**: Provider activity tracking

### Enums
- **availability_status**: TODAY, NEXT_3_DAYS, THIS_WEEK, NEXT_WEEK, UNAVAILABLE
- **verification_badge**: VERIFIED, EMERGENCY_READY, GOV_APPROVED

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and run tests
4. Commit your changes: `git commit -am 'Add some feature'`
5. Push to the branch: `git push origin feature/your-feature`
6. Submit a pull request

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and updates.