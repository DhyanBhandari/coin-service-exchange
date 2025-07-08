#!/bin/bash

# Create root directory
mkdir -p backend/src/{config,controllers,middleware,models,routes,services,types,utils}
mkdir -p backend/migrations

# Create files in src/config
touch backend/src/config/database.ts
touch backend/src/config/supabase.ts

# Create files in src/controllers
touch backend/src/controllers/{auth.controller.ts,user.controller.ts,service.controller.ts,transaction.controller.ts,conversion.controller.ts,admin.controller.ts}

# Create files in src/middleware
touch backend/src/middleware/{auth.middleware.ts,role.middleware.ts,validation.middleware.ts}

# Create files in src/models
touch backend/src/models/schema.ts

# Create files in src/routes
touch backend/src/routes/{auth.routes.ts,user.routes.ts,service.routes.ts,transaction.routes.ts,conversion.routes.ts,admin.routes.ts}

# Create files in src/services
touch backend/src/services/{auth.service.ts,user.service.ts,service.service.ts,transaction.service.ts,conversion.service.ts,payment.service.ts}

# Create files in src/types
touch backend/src/types/index.ts

# Create files in src/utils
touch backend/src/utils/{constants.ts,helpers.ts,validation.ts}

# Create app.ts
touch backend/src/app.ts

# Create migration file
touch backend/migrations/0001_initial_schema.sql

# Create root-level files
touch backend/{package.json,tsconfig.json,drizzle.config.ts,.env.example,README.md}

echo "✅ Backend folder structure created successfully."
