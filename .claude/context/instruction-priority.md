# Instruction Priority

When multiple `.claude` files overlap, use this priority order:

1. `commands/`
   - Task-specific generation instructions.
2. `prompts/`
   - Output-specific guidance for a backend endpoint or frontend page.
3. `rules/`
   - Project-wide implementation constraints.
4. `context/`
   - Background information and structural reference.

Conflict resolution:
- Prefer the more specific file over the more general file.
- If two files conflict at the same level, prefer the newer convention used in `rules/`.
- Do not invent a third pattern when a project pattern already exists.
- If a request is trivial CRUD, do not over-engineer beyond the project rules.
