# Project Overview

This project is a Bluffing Coffee management system for venue operations and tournament management.

Tech stack:
- Backend: Laravel 11, PHP 8.3
- Frontend: React + Vite + TypeScript + Ant Design
- Database: MySQL 8
- Cache: Redis

Architecture:
- Monorepo structure
- `backend/` contains the Laravel API
- `frontend/` contains the React admin application

Core modules:
- Tournament
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
