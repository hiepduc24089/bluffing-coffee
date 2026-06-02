Create a complete module for [MODULE_NAME].

Requirements:
- Laravel API
- React admin page
- CRUD
- Validation
- Pagination
- Search
- Antd UI

Implementation checklist:
- Backend: migration, model, controller, form requests, service, repository, API resource, routes
- Frontend: area module folder, page, table, filters, create/edit modal, API layer, hooks, types
- Search and pagination should exist on both API and admin page when relevant
- Use project naming and folder conventions consistently

Use these references:
- `context/instruction-priority.md`
- `context/project-overview.md`
- `context/architecture.md`
- `context/backend-module-flow.md`
- `context/frontend-module-structure.md`
- `context/naming-convention.md`
- `rules/backend-rules.md`
- `rules/frontend-rules.md`
- `rules/database-rules.md`

Decision rules:
- Keep trivial CRUD simple
- Do not invent a second architecture
- Prefer explicit, maintainable code over generic abstractions
- Put admin CRUD modules under `frontend/src/admin/modules`
- Put member/main modules under `frontend/src/main/modules`
