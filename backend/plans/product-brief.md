# Zeni — Product Brief

## What is Zeni?

Zeni is a personal expense tracker that uses AI to make recording expenses effortless. Instead of manually filling out forms with amounts, categories, and dates, users can simply tell Zeni what they bought — through text, a photo, or their voice — and the AI handles the rest.

Zeni is designed for individuals and households who want to track their spending without the tedious data entry that makes most expense trackers feel like a chore.

It is a self-hosted application — users run it on their own server or computer, keeping their financial data completely private and under their control.

---

## Who is Zeni for?

- **Individuals** who want to track personal spending with minimal friction
- **Households** where multiple people share a server and each want their own expense tracking
- **Privacy-conscious users** who don't want their financial data on someone else's cloud
- **Tech-savvy users** comfortable with self-hosting (or following a simple setup guide)

---

## Core Experience

### The Problem
Traditional expense trackers require you to:
1. Open the app
2. Tap "New Expense"
3. Type the amount
4. Pick a category from a long list
5. Optionally add a description
6. Set the date
7. Save

This is tedious. Most people give up after a week.

### Zeni's Solution
With Zeni, the flow is:
1. Hit a keyboard shortcut (desktop) or tap the command bar button (mobile)
2. Type "coffee 4.50", paste a photo of your receipt, or say "I spent 30 dollars on groceries"
3. Zeni's AI fills in everything — amount, category, description, date
4. Review and confirm (or just let it save automatically)

**One shortcut. One input. Done.**

---

## Features

### 1. AI-Powered Expense Recording

The flagship feature. Users can record expenses in three ways:

**Text Input**
- Natural language: *"Lunch at the Thai place, 12 dollars"*
- Shorthand: *"coffee 4.50"*
- Detailed: *"Bought 3 shirts at Uniqlo for $89.97 yesterday"*

**Image Input**
- Take a photo of a receipt → AI reads it and creates the expense
- Photo of a menu + a note like *"I had the curry"* → AI figures out the price
- Photo of a price tag at a store

**Voice Input**
- Tap the mic, say what you spent → AI transcribes and processes it
- Ideal for on-the-go recording (*"Just spent fifteen bucks on a cab"*)

In all cases, the AI:
- Extracts the **amount**
- Determines the **category** (from the user's own category list)
- Writes a **description**
- Infers the **date** (defaults to today if not mentioned)
- Saves a **context note** — a summary of what the AI understood, so the user can verify later

If the AI can't match the expense to any of the user's categories, it goes into **"Others"** — a permanent, always-present category that acts as a catch-all.

### 2. Chat with Your Data

Users can ask Zeni questions about their spending in plain language:

- *"How much did I spend on food this month?"*
- *"What was my biggest expense in January?"*
- *"Compare my spending this month vs last month"*
- *"Any tips on where I could cut back?"*

Zeni pulls the relevant data, sends it to the AI, and returns a conversational response — potentially with charts or visualizations to illustrate the answer.

### 3. Multiple Wallets

Users can create multiple wallets in different currencies:
- *"Main Wallet — USD"*
- *"Travel Fund — EUR"*
- *"Savings — JPY"*

Each wallet tracks expenses independently. This is useful for:
- Separating personal vs business spending
- Tracking expenses in different currencies when traveling
- Organizing by purpose (daily expenses, vacation fund, etc.)

One wallet is marked as the **default** — this is where expenses go unless the user specifies otherwise.

### 4. Categories & Tags

**Categories** are user-defined. Zeni starts with only one category: **"Others"** (which cannot be removed). Users create their own categories to match their lifestyle:
- Someone might create: Food, Transport, Rent, Entertainment, Subscriptions
- Someone else might prefer: Necessities, Wants, Bills, Fun Money

Each category can have:
- A **name**
- An **icon**
- A **color**
- A **type** (expense or income)

**Tags** are free-form labels for cross-cutting organization:
- An expense categorized as "Food" could also be tagged "date night" or "work lunch"
- Tags allow flexible filtering without cluttering the category system

### 5. Budgets

Users can set spending limits:
- **Per category**: *"I want to spend no more than $200/month on dining out"*
- **Overall**: *"My total monthly budget is $2,000"*
- **Per wallet** or **across all wallets**
- **Weekly** or **monthly** periods

The interface should clearly show:
- How much of the budget has been used (progress bar)
- How much remains
- Visual warnings when approaching or exceeding the limit
- Whether the user is on track compared to where they are in the period

### 6. Recurring Expenses

For predictable, repeating expenses:
- Rent, subscriptions, gym membership, etc.
- Users define the amount, category, and frequency (daily, weekly, bi-weekly, monthly, yearly)
- Zeni automatically creates the expense when it's due
- Users can pause or stop recurring expenses at any time

### 7. Data Visualization

Charts and graphs to help users understand their spending:
- **Pie chart**: Spending breakdown by category
- **Bar chart**: Spending over time (daily, weekly, monthly)
- **Trend lines**: How spending in a category changes over time
- **Summary cards**: Total spent this month, average daily spending, top category

### 8. Browse, Search & Filter

A comprehensive list view of all expenses with:
- **Search**: Find expenses by description text
- **Filter by**: Category, tags, date range, amount range
- **Sort by**: Date (newest/oldest), amount (highest/lowest), category
- **Pagination**: For large datasets

### 9. Data Export

Users can export their expense data:
- **CSV format** — for spreadsheets
- **JSON format** — for developers or other tools
- Filterable by date range
- Per wallet

### 10. External Integrations (API & AI Assistants)

Zeni can be connected to other tools and AI assistants:
- Users can generate **API tokens** to allow external services to read and create expenses
- Through a standard protocol (MCP), users can connect AI assistants like Gemini, ChatGPT, or Claude to their Zeni instance
- Example: *"Hey Gemini, log an expense of $15 for lunch on my Zeni"*

This turns Zeni into a hub that any AI assistant can interact with, using the user's own data.

### 11. Command Bar

A prominent, always-accessible command bar inspired by Spotlight, Raycast, and Linear's command palette. This is the **primary interface** for both recording expenses and navigating the app.

**How it works:**
- On **desktop**: Triggered with a keyboard shortcut (e.g., `Cmd+K` / `Ctrl+K`). Opens as a centered modal overlay with a text input.
- On **mobile**: Accessed via a persistent floating action button (FAB) or a prominent button in the navigation bar, since keyboard shortcuts are not available on mobile devices.
- The command bar appears as a floating overlay on top of whatever screen the user is on — no page navigation required to open it.

**Expense creation (primary use case):**
- Tap the shortcut → type, paste, or speak → done. The fastest path to logging an expense.
- Supports the same multimodal inputs as AI Quick Add: natural language text, image upload/paste, and voice via a mic button inside the bar.
- Example: press `Cmd+K`, type *"lunch 12.50"*, hit Enter → expense created.
- Example: press `Cmd+K`, paste a receipt image → AI processes it → expense created.

**Navigation (secondary use case):**
- Type a page name to jump there instantly: *"budgets"*, *"settings"*, *"categories"*
- Type a wallet name to switch to it: *"Travel Fund"*
- Recent/frequent destinations shown as suggestions when the bar is empty
- Fuzzy matching so users don't need exact names

**Behavior:**
- The bar should be contextually smart — if the input looks like an expense (contains a number, a currency, or expense-like language), treat it as an expense. If it matches a page or navigation target, offer navigation.
- Show inline results/suggestions as the user types (typeahead)
- Pressing `Escape` or clicking outside dismisses the bar
- After successfully creating an expense, show a brief confirmation toast and close the bar
- The command bar should feel instant — no loading spinners, no page transitions

---

## User Accounts & Access

- **Multi-user support**: Multiple people can have accounts on the same Zeni instance (e.g., a household)
- **Simple signup**: Username and password — no email verification required
- **Admin control**: The instance admin can disable new signups once the household is set up
- **First user is admin**: The first person to sign up becomes the administrator

Each user has completely separate data — wallets, categories, expenses, budgets, and settings are all per-user.

---

## Key Interactions to Design For

### Command Bar + Quick Add (Most Important)
The primary interaction. The **command bar** is the single entry point for both expense creation and app navigation. Should be:
- **Always accessible** — on desktop, a keyboard shortcut (`Cmd+K` / `Ctrl+K`) from anywhere; on mobile, a persistent floating action button or prominent nav button
- **Multimodal** — text field, image paste/upload, and microphone button all within the command bar
- **Dual-purpose** — intelligently routes input to expense creation or page navigation based on context
- **Fast** — the AI processes and the expense appears almost instantly; navigation is instantaneous
- **Reviewable** — after AI creates the expense, the user can see what was understood and correct anything
- **Keyboard-driven on desktop** — open with shortcut, type, hit Enter, done. No mouse needed.

### Dashboard
The home screen after login. Should convey at a glance:
- How much has been spent today / this week / this month
- Recent expenses
- Budget status (if budgets are set)
- The command bar shortcut hint prominently displayed (desktop) / FAB prominently placed (mobile)

### Expense Review
When AI creates an expense, the user should be able to:
- See what the AI extracted (amount, category, description, date)
- See the AI's reasoning/context (what it understood from the input)
- Edit any field before or after saving
- This should feel lightweight — not a full form, more like confirming a suggestion

### Chat Interface
A conversational UI where users type questions and get responses:
- Should feel like messaging, not like a search engine
- Responses may include inline charts or data tables
- Keep conversation context (follow-up questions should work)

### Wallet Switching
Users with multiple wallets need an easy way to:
- See which wallet is active
- Switch between wallets
- See wallet-specific data throughout the app

---

## Design Principles

1. **Frictionless first** — Every design decision should reduce the effort needed to record an expense. If it takes more than 5 seconds to log something, we've failed.

2. **AI as assistant, not autopilot** — The AI helps, but the user stays in control. Show what the AI understood, make it easy to correct, never hide information.

3. **Glanceable insights** — Spending data should be understandable at a glance. Use visual indicators (colors, progress bars, charts) over dense tables of numbers.

4. **Personal, not corporate** — Zeni is a personal tool, not enterprise software. The tone should be friendly, the design should feel warm and inviting, not clinical.

5. **Responsive** — Must work well on both desktop (for reviewing data, managing budgets) and mobile (for quick expense recording on the go).

6. **Privacy-forward** — Reinforce that data stays on the user's own server. No tracking, no analytics, no cloud dependencies.

---

## Content & Tone

- **Voice**: Friendly, concise, helpful — like a smart friend who's good with money
- **Error messages**: Human and actionable (*"I couldn't read that receipt clearly. Want to try again or type it in?"*)
- **Empty states**: Encouraging, not blank (*"No expenses yet! Try typing 'coffee 3.50' above to get started."*)
- **AI responses**: Conversational but informative, not robotic

---

## Screens Summary

| Screen | Purpose |
|---|---|
| **Login / Signup** | Account access, simple form |
| **Dashboard** | At-a-glance overview + quick-add input |
| **Wallet View** | Expense list for a specific wallet, with filters, charts |
| **Expense Detail** | View/edit a single expense, see AI context |
| **Command Bar** | Always-accessible overlay for expense creation (text/image/voice) and quick navigation; triggered by keyboard shortcut on desktop, FAB/button on mobile |
| **Chat** | Conversational interface for data questions |
| **Budgets** | Budget cards with progress indicators |
| **Recurring** | List of recurring expenses with status |
| **Categories** | Manage user-defined categories (name, icon, color) |
| **Tags** | Manage tags |
| **Settings** | Profile, AI provider config, API tokens |
| **Admin Settings** | Signup toggle, instance management |
