Create a NEW dynamic module called "<MODULE_NAME>" for this subzero_2.0 RAD framework.

Follow ALL rules (structure, UX, seeding, permissions) from:
- .cursor/rules/cursor.rules.md
- .cursor/templates/custom-fields-module-template.md
- .cursor/templates/static-module-template.md
- Use existing templates in src/modules/_template, _template_custom, _template_static as patterns.

Module brief (fill these before running):
- Purpose (1–2 lines): <...>
- Sidebar label + icon (Lucide): "<Label>", "<IconName>"
- Entity singular/plural: "<Entity>" / "<Entities>"
- Domain fields (non-core): 
  - <field_code>: <type> – <description>
  - <field_code>: <type> – <description>
- Custom fields via Settings? (yes/no)
- Labels needed? (yes/no)
- Import/export? (yes/no)
- Duplicate action? (yes/no)
- Notifications needed? (yes/no) - If yes, specify when to send notifications (e.g., "on assignment", "on status change", "on creation")
- Special filters / extra actions / behaviors: <...>

Hard requirements:
- Place module in src/modules/<module-name>/ with the exact folder structure from the rules (config, api/handlers, routes, components, services, schemas, seeds, store, hooks, types, utils, index.ts).
- module.config.json must be correct (id, name, routes, api endpoints, permissions, navigation, fields config path, custom_field flag if enabled).
- Seed must live in src/modules/<module>/seeds/seed.ts (or moduleRegistration.ts) and register the module row, permissions, module_fields, field permissions; wire it so main scripts/seed.ts discovers and runs it (no per-module hardcoding in scripts/seed.ts).
- Use ShadCN UI from src/core/components/ui; responsive layout; debounced search (useDebounce), filters with “Clear filters”.
- Enforce RBAC end-to-end: module access, data permissions (CRUD, extras), field permissions (visibility/editability). Check permissions in UI and API.
- If custom_field = true: add customFields JSONB column, hook using useCustomFieldsStore, dynamic rendering, search only text-like types, cache invalidation.
- If labels needed: use core module_labels, module-specific hook/dialog, permission-gated manage_labels action.
- If notifications needed: import `createNotification` from `@/core/lib/services/notificationService` and send notifications at specified events. Use appropriate category (e.g., `<module>_assigned`, `<module>_updated`), include actionUrl pointing to the resource, and provide meaningful title/message. See `src/core/lib/services/README_NOTIFICATIONS.md` for examples.
- Implement CRUD API handlers with Zod validation, tenancy checks, soft deletes, consistent JSON responses.
- Implement routes/index.tsx with list/table, filters, debounced search, pagination, dialogs for create/edit, delete confirmation, toasts for feedback; hide/disable actions based on permissions.
- Implement services with server-side filters/search; include custom field search when applicable; include label handling if enabled.
- Add export/import/duplicate only if requested; guard with permissions.
- Fix all linting for touched files.

Deliverables: full module code in place, ready to run `npm run build` and `npm run seed` without errors.