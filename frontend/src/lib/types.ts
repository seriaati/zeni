export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface UserResponse {
  id: string;
  username: string;
  display_name: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface WalletResponse {
  id: string;
  user_id: string;
  name: string;
  currency: string;
  is_default: boolean;
  created_at: string;
}

export interface WalletSummary extends WalletResponse {
  total_expenses: number;
  expense_count: number;
}

export interface CategoryResponse {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: 'expense' | 'income';
  is_system: boolean;
  created_at: string;
}

export interface TagResponse {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface CategoryBrief {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface TagBrief {
  id: string;
  name: string;
  color: string | null;
}

export interface ExpenseResponse {
  id: string;
  wallet_id: string;
  category: CategoryBrief;
  amount: number;
  description: string | null;
  date: string;
  ai_context: string | null;
  tags: TagBrief[];
  group_id: string | null;
  children: ExpenseResponse[] | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseListResponse {
  items: ExpenseResponse[];
  total: number;
  page: number;
  page_size: number;
}

export interface ExpenseSummary {
  total_amount: number;
  expense_count: number;
  by_category: { category_id: string; category_name: string; category_color: string | null; total: number; count: number }[];
  by_period: { period: string; total: number; count: number }[];
}

export interface SuggestedTag {
  name: string;
  is_new: boolean;
}

export interface AIExpenseResponse {
  amount: number | null;
  currency: string | null;
  category_name: string | null;
  is_new_category: boolean;
  description: string | null;
  date: string | null;
  ai_context: string | null;
  suggested_tags: SuggestedTag[];
}

export interface AIParseResponse {
  result_type: 'single' | 'multiple' | 'group';
  expenses: AIExpenseResponse[];
  group: AIExpenseResponse | null;
}

export interface VoiceParseResponse extends AIParseResponse {
  transcript: string;
}

export interface GroupExpenseItemRequest {
  category_name?: string;
  category_id?: string;
  amount: number;
  description?: string;
  tag_names?: string[];
  tag_ids?: string[];
}

export interface GroupExpenseRequest {
  group: {
    category_name?: string;
    category_id?: string;
    amount: number;
    description?: string;
    date?: string;
    tag_names?: string[];
    tag_ids?: string[];
  };
  items: GroupExpenseItemRequest[];
}

export interface BudgetResponse {
  id: string;
  user_id: string;
  wallet_id: string | null;
  category_id: string | null;
  amount: number;
  period: 'weekly' | 'monthly';
  start_date: string;
  created_at: string;
  spent: number;
  remaining: number;
  percentage_used: number;
  is_over_budget: boolean;
}

export interface RecurringExpenseResponse {
  id: string;
  wallet_id: string;
  category_id: string;
  amount: number;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  next_due: string;
  is_active: boolean;
  created_at: string;
}

export interface APITokenResponse {
  id: string;
  name: string;
  last_used: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface APITokenCreateResponse extends APITokenResponse {
  token: string;
}

export interface AIProviderResponse {
  provider: string;
  model: string;
  api_key_masked: string;
  ocr_enabled: boolean;
}

export interface AIProviderModelsResponse {
  models: string[];
}

export interface ChatResponse {
  response: string;
  data: unknown;
}

export interface AdminSettingsResponse {
  signups_enabled: boolean;
}
