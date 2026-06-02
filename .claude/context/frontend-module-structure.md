Each frontend module should follow this structure:

admin/modules/
└── module-name/
    ├── api/
    ├── components/
    ├── hooks/
    ├── pages/
    ├── schemas/
    ├── types/
    └── utils/

For member-facing features, use the same module shape under:

main/modules/
└── module-name/

Guidelines:
- `pages/` contains route-level containers only.
- `components/` contains module-specific presentation pieces.
- `api/` contains request functions and query key helpers.
- `hooks/` contains reusable view logic and React Query wrappers.
- `schemas/` contains zod or form validation schemas if needed.
- `types/` contains DTO/view model typings local to the module.
- `utils/` contains pure helper functions only.
- `admin/routes/` and `main/routes/` own area route definitions.
- `shared/components/atoms/` contains Ant Design wrapper components such as `AppButton`, `AppTextField`, `AppSelect`, `AppTable`, and form controls.
- Prefer shared atoms over importing Ant Design controls directly when a wrapper already exists.
- Keep auth token storage helpers inside the relevant auth module.
