# Frontend: Multiple Expenses & Expense Groups UI

## Summary

The backend already supports multiple expenses and expense groups. The frontend types (`types.ts`), API layer (`api.ts`), and CommandBar review components (`SingleReview`, `MultipleReview`, `GroupReview`) are already wired up. This plan covers the remaining UI work:

1. **Carousel-style MultipleReview** — replace the stacked scrollable list with a one-at-a-time paginated view
2. **Group expense indicators** — visual badges on expense list rows
3. **Expense detail page** — sub-expenses section for group parents
4. **Delete UX** — cascade warning for group parents

---

## 1. Refactor `MultipleReview` → Carousel Style

**File:** `src/components/CommandBar.tsx` — [`MultipleReview`](../frontend/src/components/CommandBar.tsx:301)

**Current behavior:** All N expenses rendered vertically in a scrollable `div` with `maxHeight: 400`.

**New behavior:**
- Show **one `ExpenseCard` at a time**
- Track `activeIndex` state (default 0)
- **Bottom bar** with left `←` / right `→` arrow buttons and a "2 / 5" counter in the center
- Left arrow disabled when `activeIndex === 0`, right arrow disabled when at the last expense
- Each card is fully editable (existing `ExpenseCard` edit functionality unchanged)
- The "Save all N expenses" button stays at the bottom, below the nav arrows
- Add a subtle **slide transition** when switching (CSS `translateX` with `transition`)

**Rough layout:**
```
┌────────────────────────────────┐
│ 5 expenses detected            │
│                                │
│  ┌──────────────────────────┐  │
│  │   ExpenseCard (active)   │  │
│  │   Amount: ¥4,500         │  │
│  │   Category: Food         │  │
│  │   ...                    │  │
│  └──────────────────────────┘  │
│                                │
│    ← ◀   2 / 5   ▶ →          │
│                                │
│            [Save all 5 expenses]│
└────────────────────────────────┘
```

**Implementation details:**
- Add `const [activeIndex, setActiveIndex] = useState(0)` inside `MultipleReview`
- Render only `expenses[activeIndex]`
- Arrow buttons use `ChevronLeft` / `ChevronRight` from lucide-react
- Dot indicators or "N of M" text label
- Keep the existing `update(i, e)` function but always pass `activeIndex`
- When an expense is removed (if we add that ability), clamp `activeIndex`

---

## 2. Group Expense Indicator on Expense List Rows

### 2a. `WalletViewPage` — [`ExpenseRow`](../frontend/src/pages/WalletViewPage.tsx:253)

**Current:** Shows category icon, description, tags, amount, relative date. No awareness of groups.

**Change:** When `expense.children && expense.children.length > 0`, show a small group indicator:
- A `Layers` icon (from lucide-react) next to the category name
- Text like "3 items" in the subtitle line, styled as a subtle chip

**Example:**
```
  🍔  Lunch with Sarah                    ¥1,200
      Food · [Layers] 3 items · 2h ago
```

The `Layers` icon + "N items" chip sits in the existing subtitle row between category name and tags.

### 2b. `DashboardPage` — recent expenses list (line ~266)

**Same treatment** as `WalletViewPage`. The recent expense rows in [`DashboardPage`](../frontend/src/pages/DashboardPage.tsx:266) use inline styles (not the `ExpenseRow` component), so the group indicator needs to be added there too.

**Consider:** Extract a shared `ExpenseRowContent` component used by both pages to avoid duplication. However, the two rows have slightly different layouts (dashboard has no tags, wallet view has tags), so a lightweight approach is to just add the group indicator inline in both places.

**Decision:** Add the indicator inline in both places. Keep it simple — no shared component extraction (the rows are similar but not identical).

---

## 3. Expense Detail Page — Sub-Expenses Section

**File:** `src/pages/ExpenseDetailPage.tsx` — [`ExpenseDetailPage`](../frontend/src/pages/ExpenseDetailPage.tsx:320)

**Current:** Shows amount, category, date, description, tags, AI context. No children.

**Change:** When `expense.children && expense.children.length > 0`, render a **"Sub-expenses" section** after Tags and before AI context.

**Design:**
```
┌─────────────────────────────────┐
│  SUB-EXPENSES                   │
│                                 │
│  ┌─ 🍔 Burger          ¥1,000 ─┐
│  │  Food                        │
│  └──────────────────────────────┘
│  ┌─ 🥤 Coke              ¥200 ─┐
│  │  Drinks                      │
│  └──────────────────────────────┘
│                                 │
│  Total: ¥1,200 (2 items)       │
└─────────────────────────────────┘
```

**Implementation:**
- Each child row is a `Link` to `/wallets/:walletId/expenses/:childId`
- Shows child's category icon, description, amount
- Summary line at the bottom: sum of children amounts + count
- Styled with existing card pattern: `background: white`, `borderRadius: 14`, `border: 1px solid var(--cream-darker)`
- Individual child rows separated by light dividers

**When the expense IS a child** (has `group_id`):
- Show a "Part of group" indicator at the top, linking back to the parent expense
- Something like: `↩ Part of "Lunch with Sarah"` — but we don't have the parent description in the child response... We do have `group_id`, so we can render a link: "Part of a group expense" → links to `/wallets/:walletId/expenses/:group_id`

---

## 4. Group Parent Delete — Cascade Warning

**File:** `src/pages/ExpenseDetailPage.tsx`

**Current delete modal text:** "Are you sure you want to delete this expense? This action cannot be undone."

**Change:** When `expense.children && expense.children.length > 0`:
- Update the warning: "This is a group expense with **N sub-expenses**. Deleting it will also delete all sub-expenses. This action cannot be undone."
- Keeps the same modal structure, just changes the text

---

## Files to Modify

| File | Change |
|---|---|
| `src/components/CommandBar.tsx` | Refactor `MultipleReview` to carousel with ← → arrows, one card at a time |
| `src/pages/WalletViewPage.tsx` | Add group indicator (Layers icon + "N items") to `ExpenseRow` |
| `src/pages/DashboardPage.tsx` | Add group indicator to recent expenses rows |
| `src/pages/ExpenseDetailPage.tsx` | Add sub-expenses section for group parents; "Part of group" link for children; enhanced delete warning |

---

## Edge Cases

- **Single expense** (`result_type: "single"`) — unchanged, `SingleReview` handles it
- **Group expense** (`result_type: "group"`) — unchanged, `GroupReview` already handles it well with the parent + items layout
- **Multiple expenses carousel** — if user is editing one card and presses arrow, should we auto-commit? **Decision:** Yes — commit pending edits when navigating away (same behavior as clicking elsewhere). Call `commitEditable()` on the current card before switching.
- **Empty children array** — API may return `children: null` or `children: []` for non-group expenses. Always check both: `expense.children && expense.children.length > 0`
- **Child expense detail** — when viewing a child expense directly (via URL), show "Part of group" link. The `group_id` field on the expense response provides the parent ID
- **Group with 1 item** — unlikely but possible if user removes items in the CommandBar. Still show group indicator
