<<<<<<< HEAD
# ExamPro — Proctored Examination Platform (Angular Frontend)

A fully production-ready Angular 17 frontend for an online proctored examination system.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Angular CLI 17: `npm install -g @angular/cli`

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Set your backend URL in:
#    src/environments/environment.ts
#    Change: apiUrl: 'http://localhost:5000/api'

# 3. Start the dev server
ng serve

# 4. Open http://localhost:4200
```

---

## 🏗️ Project Structure

```
src/app/
├── core/
│   ├── services/
│   │   ├── auth.service.ts          JWT auth, login/register/logout
│   │   ├── admin.service.ts         All admin API calls
│   │   ├── candidate.service.ts     Candidate API calls
│   │   └── proctoring.service.ts    Screenshots, violations, recording
│   ├── interceptors/
│   │   └── jwt.interceptor.ts       Auto-attaches Bearer token
│   └── guards/
│       └── auth.guard.ts            authGuard, adminGuard, candidateGuard, guestGuard
│
├── shared/
│   ├── models/
│   │   └── models.ts                All TypeScript DTOs/interfaces
│   └── components/
│       └── shell/
│           └── shell.component.ts   Sidebar layout (used by admin & candidate)
│
└── features/
    ├── auth/
    │   ├── login/                   Login page (split-panel design)
    │   ├── register/                Registration page
    │   └── forgot-password/         Forgot password flow
    │
    ├── admin/
    │   ├── admin-layout/            Admin shell with nav
    │   ├── dashboard/               Stats overview
    │   ├── tests/                   Create/Edit/Delete tests
    │   ├── questions/               Manage MCQ questions per test
    │   ├── users/                   View candidates, assign tests
    │   ├── sessions/                Monitor sessions, suspend
    │   └── violations/              Violations log
    │
    ├── candidate/
    │   ├── candidate-layout/        Candidate shell
    │   ├── dashboard/               Overview + upcoming tests
    │   ├── test-list/               All assigned tests
    │   └── result/                  Past results with score rings
    │
    └── proctoring/
        ├── exam-session/            Full proctored exam UI
        └── exam-result/             Result display after submission
```

---

## 🔐 Authentication Flow

1. Login → POST `/api/auth/login` → JWT stored in `localStorage`
2. JWT interceptor auto-attaches `Authorization: Bearer <token>` to all requests
3. Token decoded to extract role → redirect to admin or candidate dashboard
4. 401 response → auto-logout + redirect to login

---

## 👤 Roles

| Role    | Access                    |
|---------|---------------------------|
| Admin   | `/admin/*` routes         |
| User    | `/candidate/*` + `/exam/*`|

---

## 🎥 Proctoring Features

| Feature              | Implementation                              |
|----------------------|---------------------------------------------|
| Screenshot capture   | `ImageCapture` API / canvas fallback        |
| Violation detection  | `visibilitychange`, `blur`, `fullscreenchange`, `contextmenu`, `keydown` |
| Auto-suspension      | Backend response triggers locked UI         |
| Screen recording     | `MediaRecorder` + `getDisplayMedia`        |
| Webcam recording     | `MediaRecorder` + `getUserMedia`           |
| Fullscreen lock      | `requestFullscreen` on exam start          |
| Timer                | Countdown with auto-submit on expiry        |

---

## 🌐 Backend API Endpoints Expected

### Auth
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/forgot-password`

### Admin
- `GET/POST /api/tests`
- `PUT/DELETE /api/tests/:id`
- `GET/POST /api/tests/:id/questions`
- `PUT/DELETE /api/questions/:id`
- `GET /api/users`
- `GET/POST /api/assignments`
- `DELETE /api/assignments/:id`
- `GET /api/sessions`
- `GET /api/sessions/:id`
- `POST /api/sessions/suspend`
- `GET /api/violations`
- `GET /api/screenshots/:sessionId`

### Candidate
- `GET /api/assignments/my`
- `POST /api/sessions/start`
- `POST /api/sessions/answer`
- `POST /api/sessions/submit`
- `GET /api/sessions/:id/status`
- `GET /api/sessions/my-results`

### Proctoring
- `POST /api/proctoring/screenshot`
- `POST /api/proctoring/violation`
- `POST /api/proctoring/video-chunk`

---

## 🎨 Design System

| Token                   | Value                  |
|-------------------------|------------------------|
| `--color-bg`            | `#0a0d14`              |
| `--color-surface`       | `#111520`              |
| `--color-primary`       | `#4f8ef7`              |
| `--color-success`       | `#3dd68c`              |
| `--color-danger`        | `#f75f4f`              |
| `--font-main`           | DM Sans                |
| `--font-mono`           | Space Mono             |

---

## 🔧 Customization

- **Backend URL**: `src/environments/environment.ts` → `apiUrl`
- **Screenshot interval**: Set per-test in admin panel (`screenshotIntervalSeconds`)
- **Max violations**: Set per-test (`maxViolations`)
- **Add new nav items**: Edit `ADMIN_NAV` in `admin-layout.component.ts`

---

## 📦 Build for Production

```bash
ng build --configuration production
# Output: dist/exam-platform/
```

---

## ⚠️ Notes

- Media APIs (screen capture, webcam) require **HTTPS** in production
- Fullscreen mode requires user gesture — triggered on "Start Test"
- Video chunks upload in 30-second segments to avoid memory issues
- All API calls gracefully handle errors with snackbar notifications
=======
# Online-Test-Application-Frontend-
Here you will find all the frontend code of this application which is built in angular
>>>>>>> 2b56fbbf055492947b9898a23db2b54356647032
