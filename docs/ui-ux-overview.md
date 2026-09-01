---
tags: [ui, ux, docs]
type: doc
status: design-locked
---
# UI/UX Overview

Visual design terkunci pada tema **Botanical Ether Glassmorphism** yang disinkronkan dengan project Google Stitch `PlantNeeds Botanical Login` (15738293537970565966) dan dokumen `DESIGN.md`.

## Prinsip Desain
1. **Functional First**: Setiap komponen bekerja penuh untuk interaksi manusia maupun AI agent via WebMCP.
2. **Component-Based**: Menggunakan token CSS terpusat di `client/src/style.css`.
3. **Live-Sync Drivethrough (C5)**: Aksi AI agent melalui WebMCP langsung memperbarui tampilan antarmuka secara reaktif via pub/sub store.
4. **Accessible**: Kontras teks tinggi dengan fondasi warna Forest Deep di atas permukaan frosted glass.
5. **Anti-AI Slop**: Tanpa emoji dekoratif di headings/tombol, tanpa neon glow buatan, dan tanpa teks em-dash.

## Komponen Antarmuka Utama

| Komponen | Konten & Fungsi | Sumber Data | Event Trigger |
|---|---|---|---|
| **AuthCard** | Login & Register form dengan validasi dan switch mode | `/api/auth/login`, `/api/auth/register` | `auth-changed` |
| **TopNav** | Branding, status WebMCP agent, tombol Sign Out | User session state | `auth-changed` |
| **TodayBanner** | Ringkasan cuaca dan rekomendasi penyiraman tanaman outdoor | `getWateringForecast()` | `weather-updated`, `plants-changed` |
| **PlantGrid / PlantCard** | Daftar tanaman, countdown ring jadwal siram, tombol Water | `listPlants()` | `plants-changed` |
| **DueBadge** | Jumlah tanaman yang jatuh tempo perawatan | `getCareSchedule()` | `plants-changed`, `care-logged` |
| **WeatherWidget** | Curah hujan 7 hari terakhir dan perkiraan cuaca Open-Meteo | `getWateringForecast()` | `weather-updated` |
| **DiagnosisPanel** | Pemilih gejala dan hasil diagnosa riwayat tanaman | `diagnoseProblem()` | On submit form |
| **ActivityTimeline** | Log perawatan dengan atribusi "by you" atau "by agent" | `care_log` data | `care-logged` |
| **AddPlantForm** | Tambah tanaman baru dengan autocomplete 53 spesies | `addPlant()` | Form submit |
