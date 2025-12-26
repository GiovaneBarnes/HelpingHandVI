# Database Setup Instructions

## Prerequisites
- PostgreSQL installed and running
- Database created (e.g., `createdb virgin_islands_providers`)

## Running Migrations
Run the migration files in order using psql:

```bash
psql -d virgin_islands_providers -f database/migrations/001_create_enums.sql
psql -d virgin_islands_providers -f database/migrations/002_create_tables.sql
psql -d virgin_islands_providers -f database/migrations/003_create_indexes.sql
```

## Running Seeds
Run the seed files in order:

```bash
psql -d virgin_islands_providers -f database/seeds/001_seed_categories.sql
psql -d virgin_islands_providers -f database/seeds/002_seed_areas.sql
psql -d virgin_islands_providers -f database/seeds/003_seed_providers.sql
```

## Notes
- Migrations create the schema with enums, tables, and indexes
- Seeds populate initial data for categories, areas, and sample providers
- Use a migration tool like Flyway or Liquibase for production rollback support