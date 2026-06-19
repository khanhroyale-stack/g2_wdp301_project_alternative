# Conventions
## Backend
- Models: `name.model.js` (snake_case). Always declare `collection` in schema options. Use `timestamps: true`.
- Controllers: `name.controller.js`. Wrap each function in `try/catch`. Standard JSON response: `{ success: true, data: ... }` or `{ success: false, message: "..." }`. Keep logic here, not in routes.
- Routes: `name.routes.js`. Prefix `/api/<resource>` (plural, kebab-case). Apply `protect` and optionally `adminOnly` middleware before controllers.
- Ref: Use `mediaId` for MediaFile refs, not `field`. `ref` must match Model name exactly.
## Frontend
- Components: PascalCase `Name.jsx`.
- Pages: `NamePage.jsx` inside `src/pages/`.
- Services: `name.service.js`. All API calls go here, do not use Axios directly in components. Base URL from config/env, don't hardcode localhost.
- State: Auth state in Context. Limit prop drilling (max 2 levels).