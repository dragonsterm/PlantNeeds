---
tags: [tasks, day-log]
type: day
day: 7
---
# 📅 Day 07 — Agent Browser Pass & E2E Verification

> Tasks: **T-15** (see [[tasks/kanban]]) · Roadmap: [[plan]]

## Checklist
- [ ] Open deployed/local app in ChatGPT in-app browser or Chrome (`chrome://flags/#enable-webmcp-testing`)
- [ ] Run full SRD §6 demo scenario end-to-end:
  - 1. Weather forecast query -> `get_watering_forecast` (verifies outdoor rain skip)
  - 2. Plant symptom query -> `diagnose_problem` (verifies overwatering diagnosis citing care history)
  - 3. Action query -> `log_care_activity` (verifies live UI update without reload)
- [ ] Iterate and fine-tune tool descriptions in `client/src/tools/register-tools.js` (C7) for 100% LLM selection reliability
- [ ] Ensure all 7 tools return clean, structured JSON schemas without markdown hallucinations

## ✅ Gate / Acceptance
Full SRD §6 demo scenario passes end-to-end with live UI updates in ChatGPT/Chrome browser 🏁 **Day 7 gate**

---
[[tasks/day-06|← Day 6]] · [[tasks/kanban|Kanban]] · [[tasks/day-08|Day 8 →]]
