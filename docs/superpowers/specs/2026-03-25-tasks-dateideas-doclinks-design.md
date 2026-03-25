# Design: Tasks, Date Ideas, and Doc Links

## Overview

Add three new independent sections to the Logger platform, each with its own sidebar entry, page, API routes, and database model. These are standalone features — not connected to the existing entries/vocabulary system.

## Data Models

### Task

| Field          | Type      | Notes                                  |
|----------------|-----------|----------------------------------------|
| `id`           | UUID      | Auto-generated, primary key            |
| `created_at`   | DateTime  | Auto-set                               |
| `updated_at`   | DateTime  | Auto-updated                           |
| `title`        | String    | Required                               |
| `notes`        | String?   | Optional text                          |
| `due_date`     | Date?     | Optional due date (`@db.Date`, date-only, no time component) |
| `completed`    | Boolean   | Default `false`                        |
| `completed_at` | DateTime? | Set when marked complete, cleared on revert |

### DateIdea

| Field          | Type      | Notes                                       |
|----------------|-----------|---------------------------------------------|
| `id`           | UUID      | Auto-generated, primary key                 |
| `created_at`   | DateTime  | Auto-set                                    |
| `updated_at`   | DateTime  | Auto-updated                                |
| `name`         | String    | Required — the idea title                   |
| `description`  | String?   | Optional details                            |
| `completed`    | Boolean   | Default `false`                             |
| `completed_at` | DateTime? | Set when marked done, cleared on revert     |
| `review`       | String?   | Optional — "how it went" note on completion |

### DocLink

| Field         | Type     | Notes                         |
|---------------|----------|-------------------------------|
| `id`          | UUID     | Auto-generated, primary key   |
| `created_at`  | DateTime | Auto-set                      |
| `updated_at`  | DateTime | Auto-updated                  |
| `title`       | String   | Required                      |
| `url`         | String   | Required — any non-empty string, no format validation (user may paste partial URLs) |
| `description` | String?  | Optional                      |
| `tags`        | Tag[]    | Many-to-many relation via implicit join table |

### Tag

| Field        | Type     | Notes                       |
|--------------|----------|-----------------------------|
| `id`         | UUID     | Auto-generated, primary key |
| `created_at` | DateTime | Auto-set                    |
| `updated_at` | DateTime | Auto-updated                |
| `name`       | String   | Unique                      |

## API Routes

### `/api/tasks`

- **GET** — List tasks. Query params: `completed` (boolean filter). Returns tasks sorted by due date (nulls last), then created_at.
- **POST** — Create task. Body: `{ title, notes?, due_date? }`. Returns created task.

### `/api/tasks/[id]`

- **GET** — Fetch single task.
- **PUT** — Update task fields. Body can include: `title`, `notes`, `due_date`, `completed`. When `completed` is set to `true`, auto-set `completed_at` to now. When set to `false`, clear `completed_at`.
- **DELETE** — Delete task (no confirmation dialog — handle confirmation on frontend).

### `/api/date-ideas`

- **GET** — List date ideas. Query params: `completed` (boolean filter). Returns ideas sorted by created_at descending.
- **POST** — Create date idea. Body: `{ name, description? }`. Returns created idea.

### `/api/date-ideas/[id]`

- **GET** — Fetch single date idea.
- **PUT** — Update date idea fields. Body can include: `name`, `description`, `completed`, `review`. When `completed` is set to `true`, auto-set `completed_at`. When set to `false`, clear `completed_at` and `review`.
- **DELETE** — Delete date idea (no confirmation dialog — handle confirmation on frontend).

### `/api/doc-links`

- **GET** — List doc links with tags. Query params: `tag` (filter by tag name). Returns links sorted by created_at descending, includes tags.
- **POST** — Create doc link. Body: `{ title, url, description?, tags?: string[] }`. Tags are created if they don't exist (connect-or-create pattern).

### `/api/doc-links/[id]`

- **GET** — Fetch single doc link with tags.
- **PUT** — Update doc link. Body can include: `title`, `url`, `description`, `tags` (replaces all tags). Tags created if they don't exist.
- **DELETE** — Delete doc link (no confirmation dialog — handle confirmation on frontend). Prisma automatically cleans up implicit join table entries. Does NOT delete orphan tags.

### `/api/tags`

- **GET** — List all tags sorted alphabetically.

## Pages

### `/tasks`

- Header with "Tasks" title and "+ New Task" button
- Compact row layout: checkbox | title + notes (truncated) | due date | pencil icon | trash icon
- Clicking checkbox toggles completion — completed tasks move to hidden section
- Due dates color-coded: red (overdue), teal/accent (upcoming), muted (no date)
- Collapsible "Show completed (N)" section at bottom with faded completed tasks
- Completed tasks show completion date and have unchecking to revert
- New/Edit task via dialog: title, notes (textarea), due date (calendar picker)

### `/date-ideas`

- Header with "Date Ideas" title and "+ Add Idea" button
- Compact row layout: name + description (truncated) | checkmark icon | pencil icon | trash icon
- Checkmark icon (teal) marks as done — opens a simple dialog with a textarea for an optional review note and "Save" / "Skip" buttons. Clicking Skip still marks it completed (with no review). The review can be edited later via the Edit dialog on the completed item.
- Collapsible "Show completed dates (N)" section at bottom
- Completed ideas show: strikethrough name, review note in teal italic, completion date, revert (undo) icon button
- New/Edit idea via dialog: name, description (textarea)

### `/doc-links`

- Header with "Doc Links" title and "+ Add Link" button
- Tag filter bar: pill buttons for each tag, "All" selected by default, click to filter
- Compact row layout: title (blue clickable link) + tag pills + description (truncated) | pencil icon | trash icon
- Clicking the title opens the URL in a new tab
- New/Edit link via dialog: title, url, description (textarea), tags (text input where user types comma-separated tag names, parsed on submit)

## Sidebar

Three new items added to the sidebar navigation below existing items:

- **Tasks** — icon: `CheckSquare` from lucide-react — route: `/tasks`
- **Date Ideas** — icon: `Heart` from lucide-react — route: `/date-ideas`
- **Doc Links** — icon: `Link` from lucide-react — route: `/doc-links`

## Component Patterns

Follow existing codebase conventions:

- "use client" pages with useState/useEffect for data fetching
- Dialog components for create/edit forms (like `NewEntryDialog`, `AddTypeDialog`)
- shadcn/ui components: Button, Input, Textarea, Calendar, Popover, Dialog, Label
- Lucide React for icons (Pencil, Trash2, Check, Undo2, etc.)
- Prisma singleton client from `@/lib/db`
- Error handling with try/catch, appropriate HTTP status codes
- No pagination needed — this is a small personal app, all records returned per list endpoint

## Error Handling

- API routes: try/catch with 500 responses, 404 for missing resources, 400 for validation errors
- Frontend: loading states, error messages for failed fetches
- Empty states: "No tasks yet" / "No date ideas yet" / "No doc links yet" with prompt to add first item
- DocLink tags: P2002 duplicate handling (same as EntryType pattern)
