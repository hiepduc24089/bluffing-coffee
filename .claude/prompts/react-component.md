Create a React admin page using:
- Vite
- React Query
- Antd
- TypeScript

Features:
- table
- pagination
- filter
- create/edit modal

Requirements:
- Follow `context/frontend-module-structure.md`
- Follow `rules/frontend-rules.md`
- Keep route page thin and move reusable logic into hooks/components
- Put request logic in module `api/`
- Place admin pages under `src/admin/modules/[module-name]`
- Place member/main pages under `src/main/modules/[module-name]`
- Use typed table rows, form values, and filters
- Include loading, empty, and submission states
- Prefer existing shared atom wrappers for common inputs, buttons, tables, modals, selects, and date pickers

Output quality bar:
- Production-ready and modular
- Avoid oversized page files
- Prefer clear CRUD flows over clever abstractions
