# PlantNeeds WebMCP Test Report

## Scope

Test target: `http://localhost:5173/`  
Test surface: Codex in-app browser  
Test date: 2026-09-02

This report covers the visible PlantNeeds dashboard and the page-defined WebMCP tools. No state-changing tool was called and no plant data was modified.

## Result summary

WebMCP discovery is working: the browser found seven tools registered by the page.

| Workflow | Registered tool | Test outcome |
| --- | --- | --- |
| Add a plant | `add_plant` | Discovered; not invoked because it changes data. |
| View care schedule | `get_care_schedule` | Invoked with `{ "days_ahead": 7 }`; returned an empty list. |
| Weather-based watering | `get_watering_forecast` | Discovered; not invoked because it depends on location and live weather data. |
| Diagnose a plant | `diagnose_problem` | Discovered; not invoked because it needs a plant ID and care history. |
| Log care | `log_care_activity` | Discovered; not invoked because it changes data. |
| Plan planting | `plan_seasonal_planting` | Discovered; not invoked because it depends on location. |
| Log growth | `log_growth` | Discovered; not invoked because it changes data. |

The WebMCP consumer successfully discovered and called a page tool, so registration and basic invocation are verified. The data returned by `get_care_schedule`, however, is inconsistent with the UI.

## Findings

### 1. Care-schedule data is inconsistent

The dashboard reports care is due and the **View Schedule** modal shows two watering tasks:

- Monstera Deliciosa — overdue
- Golden Pothos — due in 3 days

But `get_care_schedule({ "days_ahead": 7 })` returned `[]`. An agent therefore sees a different truth from a user viewing the app.

**Impact:** an assistant could incorrectly tell the user that no care is due.

### 2. Invalid input does not return a useful validation error

Calling `get_care_schedule` with an invalid `days_ahead` value was rejected with `Failed to fetch care schedule`.

**Impact:** the error does not say which input was invalid, what values are accepted, or whether the failure is validation, storage, or a network problem.

### 3. The schedule UI renders missing data

Both schedule entries render `Watering (Indoor) • undefined`.

**Impact:** the UI is exposing an absent or incorrectly mapped field, which is a strong signal that the UI and tool may be transforming different data shapes.

### 4. Navigation is only partially wired

Selecting the **Care Schedule** navigation link changed the URL to `#schedule` but did not reveal the schedule content. The **View Schedule** button did open the modal.

**Impact:** navigation and the dashboard button do not behave consistently.

### 5. Console warning

The only browser-console warning was that the Tailwind CDN script is intended for development rather than production. It did not appear related to the schedule issue.

## Recommended design: one source of truth

The UI and WebMCP tools should call the same application-level service, not separate mock arrays, component state, or formatting logic.

```text
Plant data store / API
        |
        v
CareScheduleService.getUpcomingCare()
        |                         |
        v                         v
Schedule UI                  get_care_schedule tool
```

Use a normalized domain type at this boundary. For example, every care item should include a stable ID, plant ID, activity, due date, status, and display-ready plant details. Let UI-only formatting happen after the service result is obtained; let the WebMCP tool serialize the same result directly.

## Improvement plan

1. **Centralize schedule calculation.** Extract the logic used by the modal into `getUpcomingCare({ daysAhead, plantId })`. Make both the modal and `get_care_schedule` call it.
2. **Remove static or duplicated test data.** If the dashboard uses seed data, make the WebMCP tool read that exact seed/store during development. If the app uses an API, make both consumers call the same endpoint.
3. **Define and validate one contract.** Create a shared schema for plant records and schedule items. Validate `days_ahead` as a finite positive integer within a documented limit, such as `1..30`.
4. **Never render missing values silently.** Replace `undefined` with a deliberate fallback while fixing the mapping, e.g. `Due date unavailable`. Prefer failing a development test when a required schedule field is absent.
5. **Return actionable tool errors.** Distinguish invalid input, no data, unavailable storage/API, and unexpected errors. Include a stable error code and a user-safe message.
6. **Make navigation use the same state transition.** The nav link and **View Schedule** button should open the same route or modal state.
7. **Mark tools accurately.** Treat `get_care_schedule` as read-only; keep mutating tools such as `add_plant` and `log_care_activity` explicit about their effects and require application-side confirmation where appropriate.

## Debugging checklist

Follow this order to locate the divergence.

1. Log the raw plant collection used by the dashboard, modal, and `get_care_schedule`; compare record counts and IDs.
2. Log the raw output from the shared schedule-calculation function before UI formatting or WebMCP serialization.
3. Trace `get_care_schedule` end to end: registered callback, input parsing, store/API read, schedule calculation, and returned value.
4. Verify that the tool runs after the app's seed data or store hydration completes. A common cause of `[]` is registration capturing empty initial state.
5. Inspect the missing field behind `undefined`; determine whether it is a wrong property name, an optional field, or an incomplete seed record.
6. Trigger the schedule route directly and compare it with the **View Schedule** button's state transition.
7. Add structured development logs with a request ID; do not include secrets or private user data in tool outputs or logs.

## Regression tests to add

Use fixed, isolated fixture data so these tests do not alter a user's garden.

| Test | Expected result |
| --- | --- |
| Schedule service with the fixture garden | Returns the same two due items the modal displays. |
| `get_care_schedule({ days_ahead: 7 })` | Returns the same IDs, activity, due date, and status as the service. |
| Schedule UI with the fixture garden | Displays those same items and never displays `undefined`. |
| Invalid `days_ahead` | Returns a validation error that names the field and accepted range; no data changes. |
| Empty garden | UI and tool both return an intentional empty state. |
| Route and dashboard entry point | Both open the same schedule view. |
| Reload after tool registration | Tools still use the hydrated, current store rather than stale initial data. |

For an end-to-end WebMCP test, load the fixture garden, fetch the page's registered tools, call the read-only schedule tool, and compare its structured result with the schedule service result. Keep mutation tests separate and reset their fixture state after each run.

## Verification status

- **Native-browser verified:** the localhost page loaded, registered WebMCP tools, and exposed them to the in-app browser.
- **Target-agent verified:** the in-app browser discovered all seven tools and invoked `get_care_schedule`.
- **Not verified:** mutation workflows, real-weather behavior, and a corrected shared data path.

