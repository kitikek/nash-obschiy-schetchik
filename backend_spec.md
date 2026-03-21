# Backend Specification — «Наш Общий Счётчик»

## Stack

| Layer | Technology |
|---|---|
| Language | Go |
| Database | PostgreSQL |
| DB Driver | pgx |
| Auth | JWT (Bearer) |
| Transport | HTTP/JSON REST |
| Base URL | `/api/v1` |

---

## Architecture

Three-layer pattern: **Handler → Service → Repository**

```
Frontend (React)
    ↓ HTTP/JSON
Router
    ↓
Handler     — validate input, form HTTP response
    ↓
Service     — business logic, orchestration
    ↓
Repository  — SQL via pgx
    ↓
PostgreSQL
```

### Modules

| Module | Handler | Service | Repository |
|---|---|---|---|
| Auth | AuthHandler | AuthService | UserRepository |
| Users | — | — | UserRepository |
| Groups | GroupsHandler | GroupsService | GroupRepository |
| Expenses | ExpensesHandler | ExpensesService | ExpenseRepository |
| Balances | BalancesHandler | — | BalanceRepository |
| Debt calc | — | DebtsCalculator | BalanceRepository |

---

## Database Schema

### `users`
```sql
id            SERIAL PRIMARY KEY
username      VARCHAR(50)  NOT NULL
email         VARCHAR(100) NOT NULL UNIQUE
password_hash VARCHAR(255) NOT NULL          -- bcrypt
phone         VARCHAR(20)
created_at    TIMESTAMP    DEFAULT NOW()
last_login    TIMESTAMP
```

### `groups`
```sql
id          SERIAL PRIMARY KEY
name        VARCHAR(100) NOT NULL
description TEXT
created_by  INTEGER NOT NULL REFERENCES users(id)
created_at  TIMESTAMP DEFAULT NOW()
is_active   BOOLEAN DEFAULT TRUE
currency    VARCHAR(3) DEFAULT 'RUB'         -- ISO 4217
```

### `group_members`
```sql
id         SERIAL PRIMARY KEY
user_id    INTEGER NOT NULL REFERENCES users(id)
group_id   INTEGER NOT NULL REFERENCES groups(id)
joined_at  TIMESTAMP DEFAULT NOW()
is_admin   BOOLEAN DEFAULT FALSE
UNIQUE (user_id, group_id)
```

### `expenses`
```sql
id           SERIAL PRIMARY KEY
group_id     INTEGER NOT NULL REFERENCES groups(id)
description  VARCHAR(255) NOT NULL
total_amount DECIMAL(10,2) NOT NULL
expense_date DATE NOT NULL
created_by   INTEGER NOT NULL REFERENCES users(id)
created_at   TIMESTAMP DEFAULT NOW()
is_deleted   BOOLEAN DEFAULT FALSE            -- soft delete
```

### `expense_participants`
```sql
id           SERIAL PRIMARY KEY
expense_id   INTEGER NOT NULL REFERENCES expenses(id)
user_id      INTEGER NOT NULL REFERENCES users(id)
share_amount DECIMAL(10,2) NOT NULL           -- доля участника
is_payer     BOOLEAN DEFAULT FALSE
UNIQUE (expense_id, user_id)
-- INVARIANT: SUM(share_amount) WHERE expense_id = X = expenses.total_amount
```

### `balances`
```sql
id          SERIAL PRIMARY KEY
group_id    INTEGER NOT NULL REFERENCES groups(id)
creditor_id INTEGER NOT NULL REFERENCES users(id)  -- кому должны
debtor_id   INTEGER NOT NULL REFERENCES users(id)  -- кто должен
amount      DECIMAL(10,2) NOT NULL
paid_amount DECIMAL(10,2) DEFAULT 0
last_updated TIMESTAMP DEFAULT NOW()
UNIQUE (group_id, creditor_id, debtor_id)
-- INVARIANT: SUM(amount - paid_amount) across group = 0
```

---

## API Endpoints

Все защищённые маршруты требуют: `Authorization: Bearer <JWT>`

Ошибки возвращаются в формате:
```json
{ "error": "human-readable message", "code": "SNAKE_CASE_CODE", "field": "optional" }
```

### Auth

| Method | URL | Body | Response |
|---|---|---|---|
| POST | `/auth/register` | `{username, email, password, phone?}` | `201 {id, username, email}` |
| POST | `/auth/login` | `{email, password}` | `200 {token, user}` |
| POST | `/auth/logout` | — | `200 {}` |

### Users

| Method | URL | Body | Response |
|---|---|---|---|
| GET | `/users/me` 🔒 | — | `200 {user + stats}` |
| PUT | `/users/me` 🔒 | `{username?, phone?}` | `200 {user}` |
| PATCH | `/users/me/password` 🔒 | `{old_password, new_password}` | `200 {}` |

`stats` в профиле: `{groups_count, expenses_count, member_since, total_turnover}`

### Groups

| Method | URL | Body / Params | Response |
|---|---|---|---|
| GET | `/groups` 🔒 | — | `200 [{group, my_balance}]` |
| POST | `/groups` 🔒 | `{name, description?, currency?, member_ids[]}` | `201 {group}` |
| GET | `/groups/:id` 🔒 | — | `200 {group, members[], stats}` |
| PUT | `/groups/:id` 🔒 | `{name?, description?, currency?}` | `200 {group}` |
| DELETE | `/groups/:id` 🔒 | — | `200 {}` |
| GET | `/groups/:id/members` 🔒 | — | `200 [{member}]` |
| POST | `/groups/:id/members` 🔒 | `{email}` | `201 {member}` |
| DELETE | `/groups/:id/members/:uid` 🔒 | — | `200 {}` |

Примечание: `user_id` — внутренний идентификатор пользователя в системе.
Во внешнем API для добавления участника используется поиск по email (`POST /groups/:id/members` с body `{email}`).
После резолва email backend сам находит `user_id` и использует его во внутренних операциях/связях.

### Expenses

| Method | URL | Body / Params | Response |
|---|---|---|---|
| GET | `/groups/:id/expenses` 🔒 | `?page&limit&from_date&to_date` | `200 {items[], total, page}` |
| POST | `/groups/:id/expenses` 🔒 | `{description, total_amount, expense_date, participants[]}` | `201 {expense}` |
| GET | `/groups/:id/expenses/:eid` 🔒 | — | `200 {expense, participants[]}` |
| PUT | `/groups/:id/expenses/:eid` 🔒 | `{description?, total_amount?, expense_date?, participants[]?}` | `200 {expense}` |
| DELETE | `/groups/:id/expenses/:eid` 🔒 | — | `200 {}` |

`participants[]` item: `{user_id, share_amount, is_payer}`

### Balances

| Method | URL | Body | Response |
|---|---|---|---|
| GET | `/groups/:id/balances` 🔒 | — | `200 {balances[], recommended_transfers[]}` |
| GET | `/groups/:id/balances/me` 🔒 | — | `200 {owe_to[], owed_by[]}` |
| POST | `/groups/:id/balances/:bid/pay` 🔒 | `{amount}` | `200 {balance}` |

`recommended_transfers[]` item: `{from_user_id, to_user_id, amount}`

---

## Debt Calculation Algorithm

> Компонент: `DebtsCalculator` (Service layer)  
> Триггер: автоматически после каждого CREATE / UPDATE / DELETE расхода

### Input
- `U` = множество участников группы
- `E` = все расходы группы где `is_deleted = false`
- Для каждого `e ∈ E`: `total_amount`, список `{user_id, share_amount, is_payer}`

### Step 1 — Individual balances

```
For each user u:
  paid[u]  = SUM(total_amount  for expenses where u is payer)
  owed[u]  = SUM(share_amount  for expense_participants where user_id = u)
  B[u]     = paid[u] - owed[u]

ASSERT: SUM(B[u]) == 0   ← системный инвариант
```

- `B[u] > 0` → кредитор (ему должны)
- `B[u] < 0` → должник

### Step 2 — Minimize transfers (greedy)

```
debtors   = [u for u if B[u] < 0], remainder[u] = |B[u]|
creditors = [u for u if B[u] > 0], remainder[u] =  B[u]
transfers = []

while debtors and creditors not empty:
    d = debtors[0]
    c = creditors[0]
    amount = MIN(remainder[d], remainder[c])
    transfers.append({from: d, to: c, amount})
    remainder[d] -= amount
    remainder[c] -= amount
    if remainder[d] == 0: remove d from debtors
    if remainder[c] == 0: remove c from creditors
```

### Step 3 — Persist (atomic transaction)

```sql
BEGIN;
  DELETE FROM balances WHERE group_id = :group_id;
  INSERT INTO balances (group_id, creditor_id, debtor_id, amount)
    VALUES ... -- one row per transfer (creditor = c, debtor = d)
  UPDATE balances SET last_updated = NOW() WHERE group_id = :group_id;
COMMIT;
```

### Precision rules
- Все суммы: `DECIMAL(10,2)` — точность до 1 копейки
- При равномерном делении остаток от деления прибавляется к доле **первого участника** (не теряется)
- Сравнение с нулём: `|value| < 0.01`

---

## Business Rules

### Expenses
- `SUM(participants.share_amount) MUST == total_amount` — валидировать в Handler
- Минимум 1 участник с `is_payer = true`
- Минимум 2 участника
- Редактировать/удалять может только `created_by`
- Удаление — soft delete (`is_deleted = true`), балансы пересчитываются

### Group members
- Нельзя удалить участника если `amount - paid_amount > 0` в таблице `balances`
- Нельзя удалить `groups.created_by`
- Добавлять/удалять участников может только `is_admin = true`
- Создатель группы получает `is_admin = true` автоматически

### Access control
- Пользователь видит только группы, где он есть в `group_members`
- Доступ к чужой группе → `403 Forbidden`
- Деактивация группы (`is_active = false`) запрещена при наличии непогашенных балансов

---

## HTTP Status Codes

| Code | When |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Validation error (wrong body, sum mismatch, etc.) |
| 401 | Missing or invalid JWT |
| 403 | Access to resource not allowed |
| 404 | Resource not found |
| 409 | Conflict (delete member with balance, delete group with debts) |
| 500 | Internal server error |
