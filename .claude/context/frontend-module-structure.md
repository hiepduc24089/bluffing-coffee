Each frontend module should follow this structure:

modules/
└── tournament/
    ├── api/
    ├── components/
    ├── hooks/
    ├── pages/
    ├── schemas/
    ├── types/
    └── utils/

Guidelines:
- `pages/` contains route-level containers only.
- `components/` contains module-specific presentation pieces.
- `api/` contains request functions and query key helpers.
- `hooks/` contains reusable view logic and React Query wrappers.
- `schemas/` contains zod or form validation schemas if needed.
- `types/` contains DTO/view model typings local to the module.
- `utils/` contains pure helper functions only.
