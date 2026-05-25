# Database Rules

- Use snake_case
- All tables must have:
  - id
  - created_at
  - updated_at
- Foreign keys required
- Add `deleted_at` only when soft delete is required
- Avoid polymorphic relations unless necessary
- Use unsigned big integer or UUID consistently with the existing table pattern
- Add indexes for foreign keys and frequent search/filter columns
