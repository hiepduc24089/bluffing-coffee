# Backend Rules

Architecture:
- Use Controller -> Service -> Repository architecture
- Controllers handle HTTP concerns only
- Services contain business logic
- Repositories handle database access and complex queries
- Repositories must not contain business logic

Code Style:
- Keep controllers thin
- Use FormRequest for validation
- Use API Resource for response formatting
- Use enums instead of magic strings
- Use DTOs for complex service payloads
- Use UUID for public ids
- Never query DB directly in controllers
- Prefer constructor injection
- Keep methods small and named by business intent

Database:
- Use transactions for tournament actions
- Avoid N+1 queries
- Use eager loading appropriately
- Lock rows explicitly for critical seat/chip/tournament state transitions

Project Structure:
- Follow the shared application-layer structure defined in `context/architecture.md`
- Keep services focused on a single business responsibility
- Introduce subfolders only when a module becomes large enough to justify them

Avoid:
- Fat controllers
- Fat models
- Business logic inside repositories
- Over-engineering trivial CRUD modules
- Returning raw models directly from controllers
- Mixing validation rules into services
