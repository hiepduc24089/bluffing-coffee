# Architecture

Frontend structure:

src/
├── admin/
│   ├── layouts/
│   ├── modules/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   └── tournament/
│   └── routes/
├── main/
│   ├── modules/
│   │   └── auth/
│   └── routes/
├── routes/
├── shared/
│   ├── components/
│   ├── lib/
│   └── types/
└── utils/

Rules:
- Use area-based, feature-based module architecture.
- Admin-only features live in `src/admin/modules/`.
- Main/member-facing features live in `src/main/modules/`.
- Each module owns:
  - pages
  - components
  - hooks
  - api
  - schemas
  - types
  - utils
- Shared components go into `src/shared/`.
- Do not place domain-specific code into shared/
- Root `src/routes/` composes area route arrays only.
- Use the `@` alias for imports from `src`.

Backend structure:

app/
├── DTOs/
├── Enums/
├── Http/
│   ├── Controllers/Api/
│   │   ├── Admin/
│   │   ├── Main/
│   │   └── TournamentController.php
│   ├── Requests/
│   └── Resources/
├── Models/
├── Repositories/
└── Services/

Rules:
- Controllers stay thin
- Business logic belongs in Services
- Repositories only handle DB access
- DTOs are required for complex service inputs
- Keep the application layer flat and predictable unless a domain folder already exists
- Admin auth controllers live under `Http/Controllers/Api/Admin`.
- Main/member auth controllers live under `Http/Controllers/Api/Main`.
- Shared resource controllers can live directly under `Http/Controllers/Api`.
