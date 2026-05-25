Generate:
- migration
- model
- controller
- service
- repository
- request validation
- API resource
- routes

Requirements:
- Follow `context/backend-module-flow.md`
- Follow `rules/backend-rules.md` and `rules/database-rules.md`
- Put validation in FormRequest, not controller
- Put business logic in Service, not controller or repository
- Return API Resource from controller actions
- Support index, show, store, update, destroy unless the request says otherwise
- Index endpoints should support pagination and keyword search when relevant
- Use consistent naming and file placement based on project conventions

Output quality bar:
- Production-ready code, not scaffolding placeholders
- Avoid unused methods and dead abstractions
- Keep trivial CRUD simple
