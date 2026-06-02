# Project Overview

This project is a Bluffing Coffee management system for venue operations and tournament management.

Tech stack:
- Backend: Laravel 11, PHP 8.2+
- Frontend: React 18 + Vite + TypeScript + Ant Design + React Query
- Database: MySQL 8
- Cache: Redis

Architecture:
- Monorepo structure
- `backend/` contains the Laravel API
- `frontend/` contains the React application with separate admin and main areas

Core modules:
- Tournament
- Admin auth
- Main/member auth

Planned or future modules:
- Sit & Go
- POS
- Membership
- Leaderboard

Business constraints:
- No gambling or real-money payout
- Chips are not exchangeable for money

Primary goals:
- Maintainable admin workflows for staff
- Clear separation between HTTP, business logic, and persistence
- Consistent module patterns across backend and frontend

Current implementation notes:
- Admin routes live under `/admin` in both API and frontend.
- Main/member routes live under `/main` in the API and `/login` in the frontend.
- Tournament API supports public listing/detail through `/api/main/tournaments`.
- Admin tournament CRUD uses Sanctum tokens with the `admin` ability.
