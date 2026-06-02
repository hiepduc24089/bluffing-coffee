# Naming Convention

Frontend:
- hooks: useXxx
- components: PascalCase
- files: kebab-case
- page components: XxxPage
- api files: `module-name.api.ts`
- schema files: `module-name.schema.ts`
- types files: `module-name.type.ts`
- API payload and view-model fields in TypeScript use camelCase.
- Backend database columns and JSON transformation internals may use snake_case, but frontend-facing resource fields should remain camelCase.

Backend:
- Services: XxxService
- Repositories: XxxRepository
- DTOs: XxxDTO
- Enums: XxxEnum
- Form requests: XxxRequest
- API resources: XxxResource
- Controllers: XxxController
- Route names: `resource.action` in snake_case
