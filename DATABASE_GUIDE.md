# LumiX OS - Database Schema & Test Dataset Guide

This guide provides an overview of the `lumios.db` (PostgreSQL format) dataset designed for testing the LumiX OS ecosystem.

## 1. Database Schema Design

The database uses two primary schemas to separate concerns:
- **`auth`**: Handles user accounts, authentication, and security.
- **`lumix`**: Contains the core business logic, student data, academics, finance, and system telemetry.

### Key Tables & Relationships
| Table | Schema | Description | Relationships |
|-------|--------|-------------|---------------|
| `users` | `auth` | Core identity table for all actors. | Base for Students, Teachers, Admins. |
| `students` | `lumix` | Detailed academic and behavioral data. | FK to `auth.users`, `lumix.classes`. |
| `classes` | `lumix` | Course sessions and scheduling. | FK to `auth.users` (Teacher). |
| `fee_records` | `lumix` | Financial tracking for students. | FK to `lumix.students`. |
| `system_logs` | `lumix` | Telemetry from AI agents (Nova, Astra, etc.). | Independent. |

## 2. Test Scenarios Covered

The synthetic data is designed to exercise various system capabilities:

- **Normal Use Cases**: Standard student profiles with balanced GPAs and attendance.
- **Edge Cases**:
    - Students with 0.0 GPA or 100% attendance.
    - Students with no notes or multiple badges.
    - Overdue fee records.
- **Error Conditions**:
    - Trigger-based risk level updates (High risk assigned to low GPA/Attendance).
    - Foreign key constraints (Deleting a user cascades to their student profile).
- **Performance Boundaries**:
    - **Small**: Library books and Transport routes (Static/Low volume).
    - **Medium**: 100+ Students with associated users and fee records.
    - **Large**: 1,000+ System logs for testing analytics and log parsing performance.

## 3. Advanced Database Features

- **Triggers**: `trigger_update_risk_level` automatically recalculates a student's `risk_level` based on GPA, attendance, and behavior score during any insert or update operation.
- **Functions**: `log_system_action` provides a centralized way to record telemetry from system agents.
- **Indexes**: Optimized indexes on frequently queried columns like `user_id`, `risk_level`, and `timestamp`.

## 4. How to Refresh/Regenerate Data

To refresh the dataset:
1. Drop the existing schemas: `DROP SCHEMA lumix CASCADE; DROP SCHEMA auth CASCADE;`
2. Re-run the `lumios.db` script: `psql -d your_db -f lumios.db`

The script uses `generate_series` and PL/pgSQL loops to ensure consistent data distribution every time it is executed.

## 5. Deployment Requirements

- **PostgreSQL Version**: 13+ (Uses ENUMs, JSONB, and UUID extensions).
- **Extensions**: Requires the `uuid-ossp` extension (included in the script).
- **Permissions**: Requires a user with permission to create schemas and types.
