# MentalAssess — Cognitive Assessment Platform

> A web-based platform for cognitive impairment screening using validated clinical tools (MoCA & MMSE), sensory assessments, and TCM constitution profiling.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-mentalassess.com-blue?style=for-the-badge)](https://mentalassess.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://v0-v0mentalassessmain.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [Usage](#usage)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**MentalAssess** is a web application designed to assist healthcare providers and researchers in screening for cognitive impairment. It implements two internationally recognised cognitive assessment tools — the **Montreal Cognitive Assessment (MoCA)** and the **Mini-Mental State Examination (MMSE)** — alongside sensory screening modules and a Traditional Chinese Medicine (TCM) constitution questionnaire.

Users register, complete interactive assessment tasks at their own pace, and receive an instant scored report with section-by-section breakdowns. Progress is saved automatically so assessments can be resumed if interrupted.

---

## Features

- 🧠 **MoCA Assessment** — Visuospatial/Executive, Naming, Memory, Attention, Language, Abstraction, and Orientation tasks
- 📝 **MMSE Assessment** — Orientation, Registration, Attention, Naming, Repetition, Writing, and Copying tasks
- 👁️ **Visual Screening** — Basic visual acuity and field screening
- 👂 **Auditory Screening** — Hearing sensitivity evaluation
- 👃 **Olfactory Screening** — Smell identification tasks
- 🌿 **TCM Constitution Profiling** — Traditional Chinese Medicine body-constitution questionnaire
- 📊 **Risk Dashboard** — Aggregated risk profile across all completed assessments
- 💾 **Progress Saving** — Assessments can be paused and resumed
- 🔐 **User Authentication** — Secure registration and login via Supabase
- 📱 **PWA Support** — Installable as a Progressive Web App
- 🌐 **Multilingual Ready** — i18n context for future language expansion

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Language | [TypeScript 5](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) + [tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate) |
| UI Components | [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| Backend / Auth | [Supabase](https://supabase.com/) (PostgreSQL + Row-Level Security) |
| Forms | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| Charts | [Recharts](https://recharts.org/) |
| Deployment | [Vercel](https://vercel.com/) |
| Package Manager | [pnpm](https://pnpm.io/) |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 9 — install with `npm install -g pnpm`
- A [Supabase](https://supabase.com/) project (free tier is sufficient)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/soniazebaze123-ship-it/v0-v0mentalassessmain.git
cd v0-v0mentalassessmain

# 2. Install dependencies
pnpm install
```

### Environment Variables

Create a `.env.local` file in the project root and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

You can find these values in your Supabase project under **Settings → API**.

> ⚠️ Never commit `.env.local` or any file containing secrets to version control.

#### Database Setup

Run the SQL migration scripts in the `scripts/` directory against your Supabase project in order:

```
scripts/01-create-tables.sql
scripts/02-create-storage.sql
scripts/03-fix-storage-policies.sql
scripts/05-upgrade-schema-phase1.sql
scripts/06-rls-policies-complete.sql
```

### Running Locally

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Usage

1. **Register** — Create an account with your name and email.
2. **Dashboard** — Select an assessment to begin (MoCA, MMSE, or a sensory module).
3. **Complete tasks** — Follow on-screen instructions for each interactive task. Progress is saved automatically.
4. **View results** — After finishing an assessment, review your scored report with section breakdowns.
5. **Risk Profile** — Visit the Risk Dashboard to see your aggregated health profile across all completed assessments.

---

## Deployment

The app is continuously deployed to **Vercel** from the `main` branch.

| Environment | URL |
|-------------|-----|
| Production | [https://mentalassess.com](https://mentalassess.com) |
| Vercel preview | [https://v0-v0mentalassessmain.vercel.app](https://v0-v0mentalassessmain.vercel.app) |

To deploy your own instance:

1. Fork this repository.
2. Import the fork into [Vercel](https://vercel.com/new).
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables in the Vercel project settings.
4. Deploy — Vercel handles the build and CDN automatically.

---

## Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository and create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes, following the existing code style (TypeScript strict mode, Tailwind for styling).
3. Run the linter before committing:
   ```bash
   pnpm lint
   ```
4. Open a Pull Request against the `main` branch with a clear description of what you changed and why.

Please be respectful and constructive in all interactions. This project deals with sensitive health data — take privacy and accessibility seriously in any contributions.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
