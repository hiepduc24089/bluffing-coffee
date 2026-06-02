# Frontend Rules

- Use React Query for server state
- Use Antd components
- Prefer existing shared atom wrappers before direct Antd imports for common controls
- Use function components and hooks
- Use area-based, feature-based folder structure: `src/admin/modules` and `src/main/modules`
- Keep pages thin
- Extract reusable logic into hooks
- Use TypeScript
- Avoid prop drilling
- Keep API calls inside module `api/` files
- Co-locate module-only components inside their module
- Keep table state, filters, and pagination explicit and typed
- Prefer controlled forms for admin CRUD flows
- Use the `@` alias for source imports
- Keep admin-only state, auth, routes, and layout inside `src/admin`
- Keep member/main-facing state, auth, routes, and layout inside `src/main`
- Do not create new top-level `src/modules` or `src/layouts` folders
