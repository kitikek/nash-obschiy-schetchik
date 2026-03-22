# API Specification — «Наш Общий Счётчик»

**Base URL:** `http://localhost:8080/api/v1`

**Auth:** Все 🔒 эндпоинты требуют заголовок `Authorization: Bearer <token>`

---

## Формат ошибки

```json
{ "error": "сообщение", "code": "КОД_ОШИБКИ" }
```

---

## Auth

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/auth/register` | `{username, email, password, phone?}` | `201 {id, username, email}` |
| POST | `/auth/login` | `{email, password}` | `200 {token, user}` |
| POST | `/auth/logout` | — | `200 {}` |

---

## Users

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/users/me` 🔒 | — | `200 {user, stats}` |
| PUT | `/users/me` 🔒 | `{username?, phone?}` | `200 {user}` |
| PATCH | `/users/me/password` 🔒 | `{old_password, new_password}` | `200 {}` |
| POST | `/users/find` | `{email}` | `200 {id, username}` |

**stats:** `{groups_count, expenses_count, member_since, total_turnover}`

**Пример user:**
```json
{
  "id": "cjg5o52h0001jzbl5xq3xyz",
  "username": "ivan",
  "email": "ivan@example.com",
  "phone": "+79001234567",
  "created_at": "2026-03-22T10:00:00Z"
}
```

---

## Groups

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/groups` 🔒 | — | `200 [{group, my_balance, participants_count}]` |
| POST | `/groups` 🔒 | `{name, description?, currency?, member_ids?}` | `201 {group}` |
| GET | `/groups/:id` 🔒 | — | `200 {group, members[], stats}` |
| PUT | `/groups/:id` 🔒 | `{name?, description?, currency?}` | `200 {group}` |
| DELETE | `/groups/:id` 🔒 | — | `200 {}` |
| GET | `/groups/:id/members` 🔒 | — | `200 [{id, username, email, is_admin, joined_at}]` |
| POST | `/groups/:id/members` 🔒 | `{email}` | `201 {member}` |
| DELETE | `/groups/:id/members/:uid` 🔒 | — | `200 {}` |

**member_ids** — массив строк (xid)

**Пример ответа GET /groups:**
```json
[
  {
    "group": { "id": "...", "name": "Поход в горы", "description": "...", "created_by": "...", "created_at": "...", "is_active": true, "currency": "RUB" },
    "my_balance": 1500,
    "participants_count": 3
  }
]
```

---

## Expenses

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/groups/:id/expenses` 🔒 | `?page&limit&from_date&to_date` | `200 {items[], total, page}` |
| POST | `/groups/:id/expenses` 🔒 | `{description, total_amount, expense_date, participants[]}` | `201 {expense}` |
| GET | `/groups/:id/expenses/:eid` 🔒 | — | `200 {expense, participants[]}` |
| PUT | `/groups/:id/expenses/:eid` 🔒 | `{description?, total_amount?, expense_date?, participants[]?}` | `200 {expense}` |
| DELETE | `/groups/:id/expenses/:eid` 🔒 | — | `200 {}` |

**expense:**
```json
{
  "id": "cjg5o52h0002jzbl5xq3abc",
  "group_id": "cjg5o52h0001jzbl5xq3xyz",
  "description": "Ужин в кафе",
  "total_amount": 1500.00,
  "expense_date": "2026-03-22",
  "created_by": "cjg5o52h0001jzbl5xq3xyz",
  "created_at": "2026-03-22T18:00:00Z",
  "is_deleted": false
}
```

**participant:** `{user_id, share_amount, is_payer}`

**example:**
```json
{
  "description": "Ужин",
  "total_amount": 1500,
  "expense_date": "2026-03-22",
  "participants": [
    {"user_id": "cjg5o52h0001jzbl5xq3xyz", "share_amount": 750, "is_payer": true},
    {"user_id": "cjg5o52h0002jzbl5xq3abc", "share_amount": 750, "is_payer": false}
  ]
}
```

---

## Balances

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/groups/:id/balances` 🔒 | — | `200 {balances[], recommended_transfers[]}` |
| GET | `/groups/:id/balances/me` 🔒 | — | `200 {owe_to[], owed_by[]}` |
| POST | `/groups/:id/balances/:cid/:did/pay` 🔒 | `{amount}` | `200 {balance}` |

**balance:** `{group_id, creditor_id, debtor_id, amount, paid_amount, last_updated}`

**recommended_transfers[]:** `{from_user_id, to_user_id, amount}`

---

## HTTP Status Codes

| Code | Когда |
|------|-------|
| 200 | Успех |
| 201 | Создано |
| 400 | Ошибка валидации |
| 401 | Нет/невалидный токен |
| 403 | Доступ запрещён |
| 404 | Не найдено |
| 409 | Конфликт |
| 500 | Внутренняя ошибка |

---

## Бизнес-правила

### Расходы
- Сумма долей участников = total_amount
- Минимум 1 плательщик (is_payer)
- Минимум 2 участника
- Редактировать/удалять может только создатель
- Удаление — мягкое (is_deleted), балансы пересчитываются

### Участники
- Удалить нельзя если есть непогашенный долг
- Удалить нельзя создателя группы
- Добавлять/удалять может только админ
- Создатель группы автоматически админ

### Группу нельзя удалить если есть непогашенные балансы
