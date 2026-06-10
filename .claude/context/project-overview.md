# Project Overview

This project is a Bluffing Coffee management system for venue operations, member management, and poker tournament-style gameplay management.

Business context:
- Bluffing-Coffee is a cafe/venue concept where customers can play poker as a social and competitive activity.
- The business model should stay focused on cafe operations, member experience, event scheduling, food/drink revenue, and community retention.
- Poker gameplay is organized as structured events or sessions, not as real-money gambling.
- Current researched gameplay formats are documented in `docs/Quán Poker.xlsx`.
- Gameplay formats being explored include Sit & Go Classic, Turbo, SBC Warm-Up / Ultimate Showdown, Multiday Tournament, DeepStack Classic, Mini High Roller, Monster Stack / Ultra Stack, and Mystery Bounty Event.
- Gameplay research includes blind structures, level duration, late registration/rebuy limits, break timing, estimated total duration, and non-cash reward notes.

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
- Member/user management

Planned or future modules:
- Sit & Go
- Bluffing Point (BP)
- POS
- Membership
- Leaderboard

Business constraints:
- No gambling or real-money payout
- Chips are not exchangeable for money
- No cash game
- Tournament/session rewards must not be cash or cash-equivalent payouts
- BP (Bluffing Point) is a loyalty and achievement point system attached to users/members
- BP can be awarded by gameplay placement, participation, promotions, or staff adjustment
- BP should be auditable through a transaction ledger and should avoid any direct conversion to money
- If BP is redeemable, redemption should target cafe-safe perks such as drinks, food, table time, event entry benefits, merchandise, badges, ranking status, or invitation access

Primary goals:
- Maintainable admin workflows for staff
- Clear separation between HTTP, business logic, and persistence
- Consistent module patterns across backend and frontend
- Encourage repeat visits and community competition without creating a real-money gambling loop
- Make BP balances, BP history, and leaderboard ranking transparent for members and staff

Current implementation notes:
- Admin routes live under `/admin` in both API and frontend.
- Main/member routes live under `/main` in the API and `/login` in the frontend.
- Tournament API supports public listing/detail through `/api/main/tournaments`.
- Admin tournament CRUD uses Sanctum tokens with the `admin` ability.
