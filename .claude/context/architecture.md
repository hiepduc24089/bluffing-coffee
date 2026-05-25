# Architecture

Frontend structure:

src/
├── modules/
│   ├── tournament/
│   ├── table/
│   ├── customer/
│   └── pos/
│
├── shared/
├── layouts/
├── routes/
└── hooks/

Rules:
- Use feature-based module architecture
- Each module owns:
  - pages
  - components
  - hooks
  - api
  - schemas
  - types
  - utils
- Shared components go into shared/
- Do not place domain-specific code into shared/

Backend structure:

app/
├── DTOs/
├── Enums/
├── Http/
│   ├── Controllers/
│   ├── Requests/
│   └── Resources/
├── Models/
├── Repositories/
├── Services/
└── Support/

Rules:
- Controllers stay thin
- Business logic belongs in Services
- Repositories only handle DB access
- DTOs are required for complex service inputs
- Keep the application layer flat and predictable unless a domain folder already exists
