# Multiple Expenses & Expense Groups

## Summary

Add support for two new AI output modes beyond the current single-expense flow:

1. **Multiple Expenses** — AI returns N independent expense records from one input (e.g. "coffee 4.5, salad 2.3, phone 3000")
2. **Expense Groups** — AI returns a parent expense with sub-expenses (e.g. receipt scan: "Lunch with Sarah 12$" → "burger 10$" + "coke 2$")

The AI decides which mode to use based on user input context. No inference of groups from unrelated items.

---

## Architecture

### DB: Self-Referential `group_id` on `expenses`

Add a nullable `group_id` FK column on the existing `expenses` table pointing to `expenses.id`.

```
expenses
├── id (PK)
├── wallet_id (FK)
├── category_id (FK)
├── group_id (FK → expenses.id, nullable)  ← NEW
├── amount
├── description
├── date
├── ai_context
├── created_at
├── updated_at
```

**Semantics:**
- **Standalone expense**: `group_id IS NULL`, no children → regular expense (unchanged)
- **Group parent**: `group_id IS NULL`, has children pointing to it → the "Lunch with Sarah" container
- **Group child**: `group_id IS NOT NULL` → a sub-expense like "burger 10$"

**Invariant**: sum of children amounts = parent amount.

**Listing**: default list queries filter `WHERE group_id IS NULL` (shows standalone + group parents only). Children accessible via expansion.

**Summaries**: count only rows where `group_id IS NULL` to avoid double-counting.

### AI Provider: New Output Schema

Replace `ParsedExpense` return with `ParsedExpenseOutput` discriminated by `result_type`:

```python
# In app/providers/base.py

class ParsedExpense(BaseModel):  # existing, unchanged
    amount: float
    currency: str
    category_name: str
    description: str
    date: str
    ai_context: str
    suggested_tags: list[str]

class ParsedExpenseGroupInfo(BaseModel):  # NEW - group parent metadata
    description: str
    amount: float
    currency: str
    category_name: str
    date: str
    ai_context: str
    suggested_tags: list[str]

class ParsedExpenseOutput(BaseModel):  # NEW - wrapper
    result_type: Literal["single", "multiple", "group"]
    expenses: list[ParsedExpense]      # single→len 1, multiple→len N, group→sub-expenses
    group: ParsedExpenseGroupInfo | None  # only set when result_type="group"
```

### LLM Provider Interface

Update `LLMProvider.parse_expense` → `LLMProvider.parse_expenses`:

```python
class LLMProvider(ABC):
    @abstractmethod
    async def parse_expenses(
        self, *, text: str | None, image_base64: str | None,
        image_media_type: str | None, categories: list[str], tags: list[str],
    ) -> ParsedExpenseOutput: ...
```

All 3 providers (`AnthropicProvider`, `GeminiProvider`, `OpenAICompatibleProvider`) updated to:
- Use the new `ParsedExpenseOutput` schema as the structured output target
- Use the updated system prompt

### System Prompt Update

The `SYSTEM_PROMPT` in `app/providers/base.py` needs new instructions explaining the 3 result types:

- **single**: one expense item (e.g. "coffee 4.5")
- **multiple**: independent unrelated expenses (e.g. "coffee 4.5, salad 2.3, phone 3000") — each gets its own category/tags
- **group**: contextually related items under one umbrella (e.g. "lunch with Sarah: burger 10$, coke 2$") — only when explicit context ties them together. Never infer groups from coincidental purchases.

### Service Layer (`app/services/ai_expense.py`)

- `parse_expense_with_ai` → `parse_expenses_with_ai` returning a new `ParsedExpensesResult` dataclass
- Enriches each expense with `is_new_category` and `SuggestedTagResult` objects
- For groups, also enriches the parent

```python
@dataclass
class ParsedExpenseResult:      # existing, unchanged
    amount: float
    currency: str
    category_name: str
    is_new_category: bool
    description: str
    date: str
    ai_context: str
    suggested_tags: list[SuggestedTagResult]

@dataclass
class ParsedGroupResult:         # NEW
    description: str
    amount: float
    currency: str
    category_name: str
    is_new_category: bool
    date: str
    ai_context: str
    suggested_tags: list[SuggestedTagResult]

@dataclass
class ParsedExpensesResult:      # NEW - top-level return
    result_type: str             # "single" | "multiple" | "group"
    expenses: list[ParsedExpenseResult]
    group: ParsedGroupResult | None
```

### API Schemas (`app/schemas/ai_provider.py`)

New response schemas:

```python
class AIExpenseItem(BaseModel):   # single expense in AI response
    amount: float
    currency: str
    category_name: str
    is_new_category: bool
    description: str
    date: str
    ai_context: str
    suggested_tags: list[SuggestedTag]

class AIExpenseGroupInfo(BaseModel):  # group parent in AI response
    description: str
    amount: float
    currency: str
    category_name: str
    is_new_category: bool
    date: str
    ai_context: str
    suggested_tags: list[SuggestedTag]

class AIExpensesResponse(BaseModel):  # replaces AIExpenseResponse
    result_type: str              # "single" | "multiple" | "group"
    expenses: list[AIExpenseItem]
    group: AIExpenseGroupInfo | None

class VoiceExpensesResponse(BaseModel):  # replaces VoiceExpenseResponse
    transcript: str
    result_type: str
    expenses: list[AIExpenseItem]
    group: AIExpenseGroupInfo | None
```

### Expense Schemas (`app/schemas/expense.py`)

New schemas for creating and viewing groups:

```python
class ExpenseGroupCreate(BaseModel):
    """Create a group parent + children in one request."""
    wallet_id: uuid.UUID  # implicit from URL
    group: ExpenseCreate   # the parent expense
    items: list[ExpenseCreate]  # child expenses

class ExpenseResponse(BaseModel):  # updated
    # ... existing fields ...
    group_id: uuid.UUID | None     # NEW
    children: list[ExpenseResponse] | None  # NEW - populated for group parents
```

### Router (`app/routers/expenses.py`)

Changes:
1. **`POST /ai`** → returns `AIExpensesResponse` (new schema with `result_type`)
2. **`POST /voice`** → returns `VoiceExpensesResponse`
3. **`POST /`** (create) → also handle `group_id` in `ExpenseCreate` for adding child expenses
4. **`POST /groups`** → NEW endpoint to create a full group (parent + children) in one transaction
5. **`GET /`** (list) → add `include_children: bool = False` query param; default filters out `group_id IS NOT NULL`
6. **`GET /{expense_id}`** → if expense is a group parent, include children in response
7. **`DELETE /{expense_id}`** → if group parent, cascade delete children

### Expense Model (`app/models/expense.py`)

```python
class Expense(SQLModel, table=True):
    # ... existing fields ...
    group_id: uuid.UUID | None = Field(
        default=None, foreign_key="expenses.id", index=True, ondelete="CASCADE"
    )
```

### Models `__init__.py`

No new model files needed — just the updated `Expense` model. No change to imports.

### MCP Server (`app/mcp_server.py`)

Update `list_expenses` to exclude group children by default. The `create_expense` tool stays simple (single expense). A new `create_expense_group` tool could be added later if needed.

---

## Files to Modify

| File | Change |
|---|---|
| `app/models/expense.py` | Add `group_id` FK column to `Expense` |
| `app/providers/base.py` | Add `ParsedExpenseGroupInfo`, `ParsedExpenseOutput`; update `SYSTEM_PROMPT`; rename `parse_expense` → `parse_expenses` in ABC |
| `app/providers/anthropic.py` | Implement `parse_expenses` with new output schema |
| `app/providers/gemini.py` | Implement `parse_expenses` with new output schema |
| `app/providers/openai_compat.py` | Implement `parse_expenses` with new output schema |
| `app/services/ai_expense.py` | Add `ParsedGroupResult`, `ParsedExpensesResult`; rename to `parse_expenses_with_ai` |
| `app/schemas/ai_provider.py` | Add `AIExpenseItem`, `AIExpenseGroupInfo`, `AIExpensesResponse`, `VoiceExpensesResponse` |
| `app/schemas/expense.py` | Add `group_id` and `children` to `ExpenseResponse`; add `ExpenseGroupCreate` |
| `app/routers/expenses.py` | Update `/ai`, `/voice` endpoints; add `POST /groups`; update list/get/delete for groups |
| `app/mcp_server.py` | Filter out group children in `list_expenses` |
| Migration (new file) | Add `group_id` column with FK + index |

---

## Migration

```python
# Single forward-only migration
op.add_column("expenses", sa.Column("group_id", sa.Uuid(), nullable=True))
op.create_foreign_key(
    "fk_expenses_group_id", "expenses", "expenses",
    ["group_id"], ["id"], ondelete="CASCADE"
)
op.create_index("ix_expenses_group_id", "expenses", ["group_id"])
```

---

## Edge Cases

- **Single expense input** ("coffee 4.5") → `result_type: "single"`, 1 expense, no group. Fully backward-compatible behavior.
- **Multiple unrelated items** ("coffee 4.5, phone 3000") → `result_type: "multiple"`, N expenses, no group. Each saved independently.
- **Grouped items** ("lunch: burger 10, coke 2") → `result_type: "group"`, parent "Lunch 12$" + 2 children. Parent amount = sum of children.
- **Receipt scan** → typically `result_type: "group"` if receipt has store name + line items; could be "single" if receipt has only one item.
- **Amount mismatch** → frontend should validate sum(children) == parent amount before confirming. Backend enforces on create.
- **Deleting group parent** → cascade deletes all children (via FK ondelete).
- **Deleting group child** → allowed, but frontend should prompt to update parent amount.
- **Editing group** → update parent amount when children change.
