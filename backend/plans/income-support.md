# Plan: Income Support (Rename to Transactions)

## Design Decision

**Approach:** Add a `type` field (`"expense"` | `"income"`) to the existing `Expense` model and rename the table from `expenses` to `transactions`. This reuses existing infrastructure while giving a cleaner conceptual model.

The `Category.type` field already supports `"expense" | "income"`, so category type can auto-infer transaction type. We also add an explicit `type` column on the transaction itself for flexibility (a user might want an "expense" category used in an income context, or vice versa — though unlikely).

---

## Affected Files Summary

### Database Layer (Models + Migration)
| File | Change |
|------|--------|
| `app/models/expense.py` | Rename `Expense` → `Transaction`, `ExpenseTag` → `TransactionTag`, table `expenses` → `transactions`, `expense_tags` → `transaction_tags`, add `type` field |
| `app/models/recurring.py` | Rename `RecurringExpense` → `RecurringTransaction`, table `recurring_expenses` → `recurring_transactions`, add `type` field |
| `app/models/budget.py` | No rename needed — budgets reference `category_id` which already has type. May add `type` filter to spending queries |
| `app/models/__init__.py` | Update imports to new names |
| New migration | `ALTER TABLE expenses RENAME TO transactions`, add `type` column with default `'expense'`, rename `expense_tags` → `transaction_tags`, rename `recurring_expenses` → `recurring_transactions` |

### Schemas
| File | Change |
|------|--------|
| `app/schemas/expense.py` | Rename all classes: `ExpenseCreate` → `TransactionCreate`, etc. Add `type` field to create/response schemas. Remove `amount: float = Field(gt=0)` constraint (income amounts are also positive, so keep `gt=0` — the `type` field determines the sign semantics) |
| `app/schemas/recurring.py` | Rename classes, add `type` field |
| `app/schemas/ai_provider.py` | Update `AIExpenseItem` → `AITransactionItem`, `AIExpensesResponse` → `AITransactionsResponse`, etc. Add `type` field |
| `app/schemas/wallet.py` | `WalletSummary`: add `total_income`, `income_count` alongside existing `total_expenses`/`expense_count`. Add `balance` (income − expenses) |

### Routers
| File | Change |
|------|--------|
| `app/routers/expenses.py` | Rename to `app/routers/transactions.py`. Update prefix to `/api/wallets/{wallet_id}/transactions`. Add `type` query filter to list endpoint. Update all function names and internal references. Support both `type=expense` and `type=income` creation |
| `app/routers/recurring.py` | Update to use `RecurringTransaction` model, add `type` support |
| `app/routers/wallets.py` | Update `get_wallet` summary to show income + expense totals separately, plus net balance |
| `app/routers/budgets.py` | `_compute_spent` should filter only `type='expense'` transactions (budgets track spending, not income) |
| `app/routers/categories.py` | Update references from `Expense` to `Transaction` model |
| `app/routers/export.py` | Rename to export transactions. Add `type` column to exported rows. Add `type` query filter |
| `app/routers/__init__.py` | Update import from `expenses` → `transactions` |

### Services
| File | Change |
|------|--------|
| `app/services/ai_expense.py` | Rename to `app/services/ai_transaction.py`. Update all dataclass/function names. The AI parser should also detect whether input is income vs expense and set `type` field |
| `app/services/ai_chat.py` | Update to query `Transaction` model. Build separate income/expense context sections for the LLM |
| `app/services/recurring.py` | Update to use `RecurringTransaction` and `Transaction` models. Preserve `type` when creating transaction from recurring template |
| `app/services/category_tag.py` | Update `Expense` → `Transaction` in any references (currently only categories/tags, minimal change) |

### AI Providers
| File | Change |
|------|--------|
| `app/providers/base.py` | Add `type` field to `ParsedExpense` and `ParsedExpenseGroupInfo` (rename classes to `ParsedTransaction` / `ParsedTransactionGroupInfo`). Update `SYSTEM_PROMPT` to instruct LLM to detect income vs expense. Update `CHAT_SYSTEM_PROMPT` to mention income data. Rename `ParsedExpenseOutput` → `ParsedTransactionOutput` |
| `app/providers/anthropic.py` | Update to use renamed types |
| `app/providers/gemini.py` | Update to use renamed types |
| `app/providers/openai_compat.py` | Update to use renamed types |

### MCP Server
| File | Change |
|------|--------|
| `app/mcp_server.py` | Update model imports. Rename `list_expenses` → `list_transactions`, `create_expense` → `create_transaction`. Add `type` field to create/list tools. Update `get_summary` to show income/expense breakdown |

### Other
| File | Change |
|------|--------|
| `main.py` | Update import of `process_due_recurring_expenses` → `process_due_recurring_transactions` |

---

## Detailed Steps

### Step 1: Alembic Migration

Create a forward-only migration that:
1. Renames table `expenses` → `transactions`
2. Renames table `expense_tags` → `transaction_tags`
3. Renames table `recurring_expenses` → `recurring_transactions`
4. Adds column `transactions.type VARCHAR(10) NOT NULL DEFAULT 'expense'`
5. Adds column `recurring_transactions.type VARCHAR(10) NOT NULL DEFAULT 'expense'`
6. Updates all foreign key constraints and index names to reference new table names
7. Updates `transaction_tags` FK columns (`expense_id` → `transaction_id`)

**Important:** The `budgets` table has no FK to `expenses`, so no change needed there. But `transaction_tags.expense_id` FK must be renamed to `transaction_id` and re-pointed.

### Step 2: Update Models

- **`app/models/expense.py`** → rename file to `app/models/transaction.py`
  - `Expense` → `Transaction` with `__tablename__ = "transactions"`, add `type: str = Field(default="expense", max_length=10)`
  - `ExpenseTag` → `TransactionTag` with `__tablename__ = "transaction_tags"`, rename `expense_id` → `transaction_id`
- **`app/models/recurring.py`** → `RecurringExpense` → `RecurringTransaction`, `__tablename__ = "recurring_transactions"`, add `type` field
- **`app/models/__init__.py`** → update all imports

### Step 3: Update Schemas

- **`app/schemas/expense.py`** → rename file to `app/schemas/transaction.py`
  - Rename all classes: `ExpenseCreate` → `TransactionCreate`, `ExpenseUpdate` → `TransactionUpdate`, `ExpenseResponse` → `TransactionResponse`, `ExpenseListResponse` → `TransactionListResponse`, `ExpenseSummary` → `TransactionSummary`
  - Add `type: Literal["expense", "income"] = "expense"` to `TransactionCreate`
  - Add `type: str` to `TransactionResponse`
  - Update `TransactionSummary` to include both expense and income totals
- **`app/schemas/recurring.py`** → rename classes, add `type` field
- **`app/schemas/ai_provider.py`** → rename AI response classes, add `type` field
- **`app/schemas/wallet.py`** → extend `WalletSummary` with `total_income`, `income_count`, `balance`

### Step 4: Update Providers (Base + All Implementations)

- **`app/providers/base.py`**:
  - Rename `ParsedExpense` → `ParsedTransaction`, add `type: str` field (default `"expense"`)
  - Rename `ParsedExpenseGroupInfo` → `ParsedTransactionGroupInfo`
  - Rename `ParsedExpenseOutput` → `ParsedTransactionOutput`
  - Update `SYSTEM_PROMPT` to instruct the LLM about income detection:
    ```
    - type: either "expense" or "income". Income examples: salary, refund, reimbursement,
      cashback, gift received, freelance payment, dividend, interest. Default to "expense"
      if unclear.
    ```
  - Update `CHAT_SYSTEM_PROMPT` to mention income tracking
  - Update `ChatContext` to include income fields
  - Rename `LLMProvider.parse_expenses` → `parse_transactions`
- **`app/providers/anthropic.py`**, **`app/providers/gemini.py`**, **`app/providers/openai_compat.py`**:
  - Update method names and type references

### Step 5: Update Services

- **`app/services/ai_expense.py`** → rename to `app/services/ai_transaction.py`
  - Rename all dataclasses and functions
  - `parse_expenses_with_ai` → `parse_transactions_with_ai`
  - Pass `type` through from parsed output
- **`app/services/ai_chat.py`**:
  - Query `Transaction` model
  - Split context into income vs expense totals
  - Update `_build_context` to produce separate income/expense summaries
- **`app/services/recurring.py`**:
  - Use `RecurringTransaction` and `Transaction`
  - Copy `type` from recurring template to created transaction
- **`app/services/category_tag.py`**:
  - `find_or_create_category` should accept optional `type` param so AI-created categories for income get `type="income"`

### Step 6: Update Routers

- **`app/routers/expenses.py`** → rename to `app/routers/transactions.py`
  - Prefix: `/api/wallets/{wallet_id}/transactions`
  - All endpoint functions renamed (`create_expense` → `create_transaction`, etc.)
  - `list_transactions`: add optional `type` query parameter to filter by expense/income
  - `create_transaction`: accept `type` from request body (or infer from category type)
  - `get_transaction_summary`: compute separate income/expense totals + net
  - AI endpoint: `/ai` returns `type` per parsed item
  - Voice endpoint: same treatment
- **`app/routers/wallets.py`**:
  - `get_wallet`: compute `total_expenses`, `total_income`, `balance` separately
- **`app/routers/budgets.py`**:
  - `_compute_spent`: add `.where(Transaction.type == "expense")` so income doesn't count toward budget spend
- **`app/routers/categories.py`**:
  - Update `Expense` → `Transaction` import and usage in delete reassignment
- **`app/routers/export.py`**:
  - Update model imports, add `type` to export rows, add optional `type` query filter
- **`app/routers/__init__.py`**:
  - Update import: `expenses` → `transactions`

### Step 7: Update MCP Server

- **`app/mcp_server.py`**:
  - Update all model imports
  - Rename tools: `list_expenses` → `list_transactions`, `create_expense` → `create_transaction`
  - Add `type` field to `CreateTransactionInput`, `ListTransactionsInput`
  - `get_summary`: split into income/expense totals

### Step 8: Update Entry Points

- **`main.py`**: update import from `process_due_recurring_expenses` → `process_due_recurring_transactions`

### Step 9: Lint, Format, Type Check

```sh
uv run ruff check --fix .
uv run ruff format .
uv run pyright
```

---

## API Changes (Breaking)

This is a **breaking change** for API consumers:

| Before | After |
|--------|-------|
| `POST /api/wallets/{id}/expenses` | `POST /api/wallets/{id}/transactions` |
| `GET /api/wallets/{id}/expenses` | `GET /api/wallets/{id}/transactions` |
| `GET /api/wallets/{id}/expenses/summary` | `GET /api/wallets/{id}/transactions/summary` |
| `GET /api/wallets/{id}/expenses/{eid}` | `GET /api/wallets/{id}/transactions/{tid}` |
| `PATCH /api/wallets/{id}/expenses/{eid}` | `PATCH /api/wallets/{id}/transactions/{tid}` |
| `DELETE /api/wallets/{id}/expenses/{eid}` | `DELETE /api/wallets/{id}/transactions/{tid}` |
| `POST /api/wallets/{id}/expenses/ai` | `POST /api/wallets/{id}/transactions/ai` |
| `POST /api/wallets/{id}/expenses/voice` | `POST /api/wallets/{id}/transactions/voice` |
| `POST /api/wallets/{id}/expenses/groups` | `POST /api/wallets/{id}/transactions/groups` |
| `GET /api/wallets/{id}/export` | Unchanged (but adds `type` field to rows) |

New request body field on creation:
```json
{
  "type": "income",
  "category_name": "Salary",
  "amount": 5000,
  ...
}
```

New query parameter on list:
```
GET /api/wallets/{id}/transactions?type=income
GET /api/wallets/{id}/transactions?type=expense
```

Updated wallet summary response:
```json
{
  "total_expenses": 1500.00,
  "expense_count": 42,
  "total_income": 5000.00,
  "income_count": 3,
  "balance": 3500.00
}
```

---

## Migration Safety

- Forward-only (consistent with project convention)
- Default `type='expense'` ensures all existing records remain valid
- No data loss — pure additive change + rename
- Table rename in PostgreSQL is metadata-only (instant, no data copy)
- FK and index renames are also metadata operations
