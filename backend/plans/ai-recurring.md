# AI Recurring Transaction Support

## Summary

Extend the existing AI transaction parsing endpoint to also detect and return **recurring transaction** suggestions. When user types something like `"Netflix $15.99 monthly"` or `"rent 2000 every 1st"` into the CommandBar, the AI classifies it as `result_type: "recurring"` and returns frequency/next_due metadata. The frontend shows a recurring-specific review card, and on confirm calls the existing `POST /api/wallets/{wallet_id}/recurring` endpoint.

## Architecture Decision

**Unified endpoint** — extend `POST /api/wallets/{wallet_id}/transactions/ai` rather than creating a separate `/recurring/ai` endpoint. Rationale:

- LLM already classifies intent via `result_type` discriminator (`single` | `multiple` | `group`)
- Adding `"recurring"` is a natural 4th variant in the tagged union
- CommandBar already branches on `result_type` — one more branch is trivial
- Avoids forcing the frontend to pre-classify intent before the AI has seen the input
- Voice endpoint (`/voice`) gets recurring support for free since it delegates to the same parse function

## Backend Changes

### 1. Extend `ParsedTransactionOutput` in `app/providers/base.py`

Add a new Pydantic model for parsed recurring data and extend the output union:

```python
class ParsedRecurringTransaction(BaseModel):
    amount: float
    currency: str
    category_name: str
    description: str
    frequency: str  # "daily" | "weekly" | "bi-weekly" | "monthly" | "yearly"
    next_due: str   # ISO 8601 date string
    ai_context: str
    type: str = "expense"  # "expense" | "income"
    suggested_tags: list[str] = Field(default_factory=list)


class ParsedTransactionOutput(BaseModel):
    result_type: Literal["single", "multiple", "group", "recurring"]
    expenses: list[ParsedTransaction]
    group: ParsedTransactionGroupInfo | None = None
    recurring: ParsedRecurringTransaction | None = None  # NEW
```

### 2. Update `SYSTEM_PROMPT` in `app/providers/base.py`

Add recurring detection rules to the existing system prompt:

- `"recurring"`: user describes a repeating transaction with explicit or implied periodicity (e.g. "Netflix monthly", "rent every month", "gym membership $50/mo", "weekly grocery budget $100")
- For `"recurring"`, the `recurring` field must be filled; `expenses` should be empty; `group` should be null
- `frequency` must be one of: `"daily"`, `"weekly"`, `"bi-weekly"`, `"monthly"`, `"yearly"`
- `next_due`: infer the next occurrence date in ISO 8601. If user says "starting May 1st" use that. If unspecified, use the 1st of next month for monthly, next Monday for weekly, tomorrow for daily, etc.

### 3. Add `ParsedRecurringResult` dataclass in `app/services/ai_transaction.py`

```python
@dataclass
class ParsedRecurringResult:
    amount: float
    currency: str
    category_name: str
    is_new_category: bool
    description: str
    frequency: str
    next_due: str
    ai_context: str
    type: str = "expense"
    suggested_tags: list[SuggestedTagResult] = field(default_factory=list)
```

Add `recurring` field to `ParsedTransactionsResult`:

```python
@dataclass
class ParsedTransactionsResult:
    result_type: str
    expenses: list[ParsedTransactionResult]
    group: ParsedGroupResult | None = None
    recurring: ParsedRecurringResult | None = None  # NEW
```

Enrich the recurring result in `parse_transactions_with_ai()` the same way expenses are enriched (check `is_new_category`, `is_new` for tags).

### 4. Add response schema in `app/schemas/ai_provider.py`

```python
class AIRecurringItem(BaseModel):
    amount: float
    currency: str
    category_name: str
    is_new_category: bool
    description: str
    frequency: str
    next_due: str
    ai_context: str
    type: str
    suggested_tags: list[SuggestedTag]
```

Add to `AITransactionsResponse`:

```python
class AITransactionsResponse(BaseModel):
    result_type: str  # now includes "recurring"
    expenses: list[AITransactionItem]
    group: AITransactionGroupInfo | None
    recurring: AIRecurringItem | None = None  # NEW
```

Same for `VoiceTransactionsResponse`.

### 5. Update router in `app/routers/transactions.py`

In `create_transaction_ai()` and `create_transaction_voice()`, map the new `parsed.recurring` field to the response schema `AIRecurringItem`.

### 6. No new migration needed

The `recurring_transactions` table already has all needed columns (`amount`, `description`, `category_id`, `frequency`, `next_due`, `type`, `is_active`). The AI just suggests values — actual creation uses the existing `POST /api/wallets/{wallet_id}/recurring` endpoint.

## Frontend Changes (CommandBar)

### 7. Add `RecurringReview` component

A new review card similar to `SingleReview` but showing:
- Amount + currency
- Category (with new-category badge)
- Description
- **Frequency** (editable dropdown: daily/weekly/bi-weekly/monthly/yearly)
- **Next due date** (editable date picker)
- Type (expense/income)
- Tags
- AI context
- "Save recurring" button

### 8. Add recurring state to CommandBar

```ts
const [recurringExpense, setRecurringExpense] = useState<EditableRecurring | null>(null);
```

Extend `applyParseResult` to handle `result_type === 'recurring'`.

### 9. Save handler calls recurring API

`handleSaveRecurring()` calls `POST /api/wallets/{wallet_id}/recurring` with `{ category_name/category_id, amount, frequency, next_due, description, type }`.

Note: The existing recurring creation endpoint uses `category_id` not `category_name`. The save handler needs to resolve the category first (find-or-create), similar to how single transaction save works. Two options:
- **Option A**: Add `category_name` support to the recurring creation endpoint (like `TransactionCreate` already has)
- **Option B**: Call category creation first, then recurring creation

**Recommended: Option A** — add `category_name` as an alternative to `category_id` in `RecurringTransactionCreate` schema, with the same `model_validator` pattern used in `TransactionCreate`. This keeps the frontend save flow simple and consistent.

### 10. Update `RecurringTransactionCreate` schema

```python
class RecurringTransactionCreate(BaseModel):
    category_id: uuid.UUID | None = None
    category_name: str | None = None  # NEW — alternative to category_id
    type: Literal["expense", "income"] = "expense"
    amount: float = Field(gt=0)
    description: str | None = Field(default=None, max_length=500)
    frequency: FrequencyType
    next_due: datetime
    tag_names: list[str] = Field(default_factory=list)  # NEW — for AI-suggested tags

    @model_validator(mode="after")
    def validate_category(self) -> RecurringTransactionCreate:
        # same pattern as TransactionCreate
```

### 11. Update recurring router to handle `category_name`

In `create_recurring()`, use `find_or_create_category()` when `category_name` is provided instead of `category_id`, mirroring how `_create_single_transaction()` works in the transactions router.

## Files to Modify

| File | Change |
|------|--------|
| `app/providers/base.py` | Add `ParsedRecurringTransaction` model, extend `ParsedTransactionOutput`, update `SYSTEM_PROMPT` |
| `app/providers/anthropic.py` | No change needed (uses `ParsedTransactionOutput` schema automatically) |
| `app/providers/gemini.py` | No change needed (uses `ParsedTransactionOutput` schema automatically) |
| `app/providers/openai_compat.py` | No change needed (uses `ParsedTransactionOutput` schema automatically) |
| `app/services/ai_transaction.py` | Add `ParsedRecurringResult`, extend `ParsedTransactionsResult`, enrich recurring in `parse_transactions_with_ai()` |
| `app/schemas/ai_provider.py` | Add `AIRecurringItem`, extend `AITransactionsResponse` and `VoiceTransactionsResponse` |
| `app/schemas/recurring.py` | Add `category_name` + `tag_names` to `RecurringTransactionCreate`, add `model_validator` |
| `app/routers/transactions.py` | Map `parsed.recurring` → `AIRecurringItem` in both AI and voice endpoints |
| `app/routers/recurring.py` | Handle `category_name` resolution via `find_or_create_category()` in `create_recurring()` |
| `../frontend/src/components/CommandBar.tsx` | Add `RecurringReview` component, recurring state, save handler |
| `../frontend/src/lib/types.ts` | Add `AIRecurringResponse` type, extend `AIParseResponse` |
| `../frontend/src/lib/api.ts` | Add recurring creation API call (if not already present) |
