#!/bin/bash

# Start the PostgreSQL container
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to start..."
sleep 5

# Check if PostgreSQL is running
if docker-compose ps | grep -q "foundation_postgres.*Up"; then
    echo "PostgreSQL is running."
    echo "Database URL: postgresql://foundation:daine@localhost:5432/foundation"
    echo "You can now run: npx prisma migrate dev --name init"
else
    echo "Error: PostgreSQL failed to start."
    echo "Check Docker logs: docker-compose logs postgres"
fi 