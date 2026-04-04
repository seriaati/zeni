# AI-Suggested Categories & Tags for Expenses

## Summary

When a user adds an expense via AI (text, image, or voice), the system should suggest **new categories and tags** when no suitable existing ones match — rather than always falling back to "Others". The AI will return suggested names, and the backend will flag whether they are existing or new. When the user confirms the expense, any new categories/tags are auto-created.

---

## Current Behavior

1. User submits text/image/voice → [`parse_expense_with_ai()`](app/services/ai_expense.py:60) is called
2. It fetches the user's existing category names and passes them to the LLM prompt
3. The LLM prompt in [`AnthropicProvider.parse_expense()`](app/providers/anthropic.py:58) instructs: *"category_name must exactly match one of the provided categories; if nothing fits, use 'Others'"*
4. The response ([`ParsedExpense`](app/providers/base.py:8)) returns a `category_name` string — always one of the existing categories
5. **Tags are not involved at all** in the AI parsing flow — no tag names are sent to the LLM, and none are returned
6. The frontend receives `category_name` as a string and the user manually picks tags

## Proposed Behavior

1. User submits text/image/voice → `parse_expense_with_ai()` is called  
2. It fetches both the user's existing **category names** and **tag names**, and passes both to the LLM
3. The LLM prompt is updated to: *"Pick the best category from the list. If nothing fits well, suggest a new descriptive category name (don't use 'Others' unless truly uncategorizable). Also suggest 0–3 relevant tags from the list, or new ones if none fit."*
4. The response (`ParsedExpense`) now includes:
   - `category_name: str` — existing or new
   - `is_new_category: bool` — resolved by the backend (not the LLM)
   - `suggested_tags: list[str]` — existing or new tag names
   - `new_tag_names: list[str]` — resolved by the backend
5. The frontend shows a ✨ "New" badge next to any suggested category/tag that doesn't exist yet
6. When the user confirms the expense, the backend auto-creates any new categories/tags before saving the expense

---

## Detailed Changes

### 1. Update `ParsedExpense` dataclass

**File:** [`app/providers/base.py`](app/providers/base.py:8)

Add a `suggested_tags` field to the raw LLM output:

```python
@dataclass
class ParsedExpense:
    amount: float
    currency: str
    category_name: str
    description: str
    date: str
    ai_context: str
    suggested_tags: list[str]  # NEW — tag names from LLM
```

### 2. Update the Anthropic provider prompt & parsing

**File:** [`app/providers/anthropic.py`](app/providers/anthropic.py:15)

**Prompt changes (`SYSTEM_PROMPT`):**
- Add `suggested_tags` to the expected JSON output schema
- Change category instruction from "must exactly match" to "pick from list or suggest a new one"
- Add tag instruction: "suggest 0-3 relevant tags from the provided list, or suggest new ones"
- Emphasize: do NOT default to "Others" unless the expense is truly uncategorizable

**`parse_expense()` method changes:**
- Accept a new `tags: list[str]` parameter alongside `categories: list[str]`
- Include tag names in the prompt text: `Available tags: tag1, tag2, ...`
- Parse `suggested_tags` from the JSON response

### 3. Update `LLMProvider` abstract base class

**File:** [`app/providers/base.py`](app/providers/base.py:35)

Update the `parse_expense` abstract method signature to include `tags`:

```python
@abstractmethod
async def parse_expense(
    self,
    *,
    text: str | None,
    image_base64: str | None,
    image_media_type: str | None,
    categories: list[str],
    tags: list[str],        # NEW
) -> ParsedExpense: ...
```

### 4. Update `parse_expense_with_ai()` service

**File:** [`app/services/ai_expense.py`](app/services/ai_expense.py:60)

- Fetch user's existing tags alongside categories
- Pass both to `provider.parse_expense()`
- After getting the LLM response, resolve which category/tags are new vs existing
- Return an enriched response object

### 5. Create new response schema `AIExpenseResponse`

**File:** [`app/schemas/ai_provider.py`](app/schemas/ai_provider.py:26)

Update the response schema to include tag suggestions and new-entity flags:

```python
class SuggestedTag(BaseModel):
    name: str
    is_new: bool

class AIExpenseResponse(BaseModel):
    amount: float
    currency: str
    category_name: str
    is_new_category: bool       # NEW
    description: str
    date: str
    ai_context: str
    suggested_tags: list[SuggestedTag]  # NEW
```

Similarly update `VoiceExpenseResponse`.

### 6. Update AI expense endpoints

**File:** [`app/routers/expenses.py`](app/routers/expenses.py:114) — endpoints `POST /ai` and `POST /voice`

- Update the response construction to include `is_new_category` and `suggested_tags` fields
- The `is_new_category` flag is computed by checking if `parsed.category_name` matches any existing category (case-insensitive)
- Each tag in `suggested_tags` gets an `is_new` flag by checking against existing tags

### 7. Update manual expense creation to support auto-creation

**File:** [`app/routers/expenses.py`](app/routers/expenses.py:192) — endpoint `POST /expenses`

**File:** [`app/schemas/expense.py`](app/schemas/expense.py:7) — `ExpenseCreate` schema

This is the key integration point. The frontend confirms an AI-suggested expense by calling the regular `POST /expenses` endpoint. We need to support passing category/tag **names** (not just IDs) so the backend can auto-create them:

```python
class ExpenseCreate(BaseModel):
    # Existing fields (category_id stays for backward compat)
    category_id: uuid.UUID | None = None          # CHANGED: now optional
    amount: float = Field(gt=0)
    description: str | None = Field(default=None, max_length=500)
    date: datetime | None = None
    tag_ids: list[uuid.UUID] = Field(default_factory=list)
    
    # New fields for AI-suggested creation
    category_name: str | None = None               # NEW
    tag_names: list[str] = Field(default_factory=list)  # NEW
```

**Endpoint logic update:**
- If `category_name` is provided (and `category_id` is not), look up or create the category by name
- If `tag_names` is provided, look up or create each tag by name
- Merge `tag_ids` and resolved tag IDs from `tag_names` (dedup)
- Validate that exactly one of `category_id` or `category_name` is provided

### 8. Add a service function for find-or-create logic

**New file:** `app/services/category_tag.py`

```python
async def find_or_create_category(
    user_id: UUID, name: str, session: AsyncSession
) -> Category:
    """Find existing category by name (case-insensitive) or create a new one."""
    ...

async def find_or_create_tag(
    user_id: UUID, name: str, session: AsyncSession
) -> Tag:
    """Find existing tag by name (case-insensitive) or create a new one."""
    ...
```

New categories get a default icon/color assigned. The service picks sensible defaults (the AI could optionally suggest an icon/color too — future enhancement).

---

## Data Flow (End to End)

```
User types "gym membership 50" 
    ↓
POST /api/wallets/{id}/expenses/ai  { text: "gym membership 50" }
    ↓
parse_expense_with_ai():
  - fetches categories: ["Food", "Transport", "Others"]
  - fetches tags: ["work", "personal"]
  - calls LLM with both lists
    ↓
LLM returns:
  {
    amount: 50,
    currency: "USD", 
    category_name: "Health & Fitness",   ← new!
    description: "Gym membership",
    date: "2026-04-04",
    ai_context: "...",
    suggested_tags: ["fitness", "subscription"]  ← both new!
  }
    ↓
Backend resolves:
  - "Health & Fitness" not in user's categories → is_new_category: true
  - "fitness" not in user's tags → is_new: true  
  - "subscription" not in user's tags → is_new: true
    ↓
Response to frontend:
  {
    amount: 50,
    currency: "USD",
    category_name: "Health & Fitness",
    is_new_category: true,
    description: "Gym membership", 
    date: "2026-04-04",
    ai_context: "...",
    suggested_tags: [
      { name: "fitness", is_new: true },
      { name: "subscription", is_new: true }
    ]
  }
    ↓
Frontend shows review card with ✨ badges on new items
    ↓
User confirms → POST /api/wallets/{id}/expenses
  {
    category_name: "Health & Fitness",
    amount: 50,
    description: "Gym membership",
    date: "2026-04-04",
    tag_names: ["fitness", "subscription"]
  }
    ↓
Backend:
  1. find_or_create_category("Health & Fitness") → creates it
  2. find_or_create_tag("fitness") → creates it  
  3. find_or_create_tag("subscription") → creates it
  4. Creates expense with the new category_id
  5. Creates expense_tag links
  6. Returns full ExpenseResponse
```

---

## Implementation Checklist

1. Update [`ParsedExpense`](app/providers/base.py:8) dataclass — add `suggested_tags: list[str]`
2. Update [`LLMProvider.parse_expense()`](app/providers/base.py:37) abstract signature — add `tags` param
3. Update [`AnthropicProvider`](app/providers/anthropic.py:53) — new prompt + parse `suggested_tags` + accept `tags` param
4. Update [`parse_expense_with_ai()`](app/services/ai_expense.py:60) — fetch tags, pass to provider, resolve new-vs-existing
5. Create `app/services/category_tag.py` — `find_or_create_category()` and `find_or_create_tag()` functions
6. Update [`AIExpenseResponse`](app/schemas/ai_provider.py:26) and [`VoiceExpenseResponse`](app/schemas/ai_provider.py:35) — add `is_new_category`, `suggested_tags` fields
7. Update [`ExpenseCreate`](app/schemas/expense.py:7) schema — add `category_name` and `tag_names` optional fields, make `category_id` optional
8. Update [`POST /expenses`](app/routers/expenses.py:192) endpoint — handle name-based category/tag creation
9. Update [`POST /ai`](app/routers/expenses.py:114) and [`POST /voice`](app/routers/expenses.py:155) endpoints — return enriched response
10. Frontend: update AI expense review UI to show ✨ badges and send `category_name`/`tag_names` on confirm

---

## Edge Cases

| Scenario | Handling |
|---|---|
| AI suggests category name that matches existing (different case) | Case-insensitive match → use existing, `is_new_category: false` |
| AI suggests empty tag list | Valid — return `suggested_tags: []` |
| User removes AI-suggested tag before confirming | Frontend simply doesn't include it in `tag_names` |
| User changes AI-suggested category before confirming | Frontend sends the user's chosen `category_id` instead of `category_name` |
| No AI provider configured | Existing behavior — 422 error, no change needed |
| LLM returns tag name > 100 chars | Truncate to 100 chars (matches Tag model constraint) |
| `category_name` and `category_id` both provided | Validation error — must provide exactly one |
| Neither `category_name` nor `category_id` provided | Validation error — must provide at least one |
