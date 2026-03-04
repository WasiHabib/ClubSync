# Database Reset and Population Walkthrough

This document outlines the steps to completely reset the CLUBSYNC database and populate it with initial seed data. We used these exact steps to reset your database.

## 1. Clearing the Database

To clear all existing data and start fresh, the current database needs to be dropped so the setup script can recreate a clean slate.

**Command to run from the `backend` directory:**
```bash
node -e "const mysql = require('mysql2/promise'); require('dotenv').config(); async function reset() { const conn = await mysql.createConnection({host: process.env.DB_HOST||'localhost', user: process.env.DB_USER||'root', password: process.env.DB_PASSWORD||''}); await conn.query('DROP DATABASE IF EXISTS clubsync'); console.log('Database dropped'); process.exit(0); } reset();"
```

> [!NOTE]
> You can also use the [setup-database.bat](file:///c:/Users/hp/Desktop/ClubSync/ClubSync/setup-database.bat) file located in the root directory by running [.\setup-database.bat](file:///c:/Users/hp/Desktop/ClubSync/ClubSync/setup-database.bat) which achieves a similar database creation, though you may still need to drop the database manually first if you want a complete reset.

## 2. Recreating the Schema

Once the database is dropped or if you are setting up for the first time, run the Node.js setup script in the `backend` folder. This script connects to MySQL, creates the `clubsync` database, and imports all tables, views, and stored procedures from [database/schema.sql](file:///c:/Users/hp/Desktop/ClubSync/ClubSync/database/schema.sql).

**Command to run from the `backend` directory:**
```bash
node setup-database.js
```

## 3. Populating Initial Data (Seeding)

To populate the database with dummy data, run the [seed.js](file:///c:/Users/hp/Desktop/ClubSync/ClubSync/backend/seed.js) script in the `backend` directory. 

**This script automatically performs the following tasks:**
- Confirms that clubs and stadiums exist based on the imported schema.
- Creates an admin user (`admin` email, `admin123` password).
- Sets up an active season (e.g., "BPL 2024-25").
- Generates 25-30 random players per club with varied positions, stats, nationalities, and names.
- Adds manager profiles for the clubs.
- Simulates round-robin matches complete with match events (goals, yellow/red cards).

**Command to run from the `backend` directory:**
```bash
node seed.js
```

## Summary Checklist
Whenever you want to completely wipe the existing football data and generate new ones, you just need to run these 3 commands in order from the `backend/` directory:

1. `node -e "const mysql = require('mysql2/promise'); require('dotenv').config(); async function reset() { const conn = await mysql.createConnection({host: process.env.DB_HOST||'localhost', user: process.env.DB_USER||'root', password: process.env.DB_PASSWORD||''}); await conn.query('DROP DATABASE IF EXISTS clubsync'); console.log('Database dropped'); process.exit(0); } reset();"`
2. `node setup-database.js`
3. `node seed.js`
