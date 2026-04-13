# TaskFlow 🚀

TaskFlow is a simple task management app where you can create projects, add tasks, and track progress using a Kanban board.

I built this as part of a frontend assignment to demonstrate how I structure real-world React applications with proper state management, API handling, and clean UI.

---

## ✨ Features

* **Authentication (mocked)**
  Register, login, logout with protected routes. Auth state is persisted so you stay logged in after refresh.

* **Projects & Tasks**
  Create projects and manage tasks inside them.

* **Kanban Board**
  Tasks are grouped into:

  * To Do
  * In Progress
  * Done

  You can drag and drop tasks between columns.

* **Filtering & Search**

  * Filter tasks by status
  * Filter by assignee
  * Search tasks by title

* **Optimistic Updates**
  UI updates instantly when you:

  * Move tasks
  * Delete tasks/projects

  If something fails, it rolls back.

* **Dark Mode**
  Toggle between light and dark mode (saved in localStorage).

* **Good UX**

  * Loading skeletons
  * Proper error messages
  * Empty states (no blank screens)

---

## 🛠 Tech Stack

* React + TypeScript
* React Router
* React Query (server state)
* Zustand (auth state)
* Tailwind CSS + shadcn/ui
* MSW (Mock Service Worker for API)

---

## 🚀 Running Locally

```bash
git clone https://github.com/prince0886/Task-Flow.git
cd Task-Flow
npm install
npm run dev
```



---

## 🔐 Demo Credentials

Email: [john@example.com](mailto:john@example.com)
Password: password123

---

## 🧠 How I Structured This

I separated state into two types:

* **Client state (Zustand)**
  → auth, UI state

* **Server state (React Query)**
  → projects, tasks, API calls

This keeps things clean and avoids mixing concerns.

---

## ⚠️ Notes

* There is no real backend — MSW is used to mock APIs.
* The app behaves like a real app, but data is stored locally.

---

## 🔧 What I Would Improve

If I had more time, I would:

* Connect to a real backend
* Add pagination for large datasets
* Add unit tests
* Improve accessibility (keyboard navigation, ARIA)

---

## 📌 Final Thoughts

This project focuses on:

* clean architecture
* good UX
* real-world patterns

More than just making it “look good”, I tried to make it behave like a real product.
