# replace.md

Документ фиксирует, какие места фронтенда сейчас работают на временных моках/локальной логике и должны быть заменены вызовами backend API по `backend_spec.md`.

## 1) Базовый API слой

- `src/services/api.ts`
  - Заменить `baseURL` на `"/api/v1"`.
  - Добавить axios-interceptors:
    - автоматическая подстановка `Authorization: Bearer <token>`;
    - единая нормализация ошибок в формат спеки `{ error, code, field }`.

## 2) Аутентификация и профиль

- `src/services/auth.ts`
  - Полностью убрать работу с `src/mocks/db.ts` и EmailJS.
  - Привязать к endpoint-ам:
    - `POST /auth/register`
    - `POST /auth/login`
    - `POST /auth/logout`
  - Временные страницы `forgot/reset` оставить как отдельный non-spec flow или удалить после согласования.

- `src/contexts/AuthContext.tsx`
  - Оставить хранение токена на фронте (local/session) как UI-решение.
  - Добавить проверку валидности сессии через `GET /users/me` при инициализации.

- `src/services/user.ts`
  - Удалить локальные расчеты (`getUserTotalExpenses`, `getUserGroupsCount`) на основе моков.
  - Перенести на:
    - `GET /users/me` (включая `stats`)
    - `PUT /users/me`
    - `PATCH /users/me/password`

## 3) Группы и участники

- `src/services/groups.ts`
  - Убрать CRUD через `mocks/db`.
  - Заменить на:
    - `GET /groups`
    - `POST /groups`
    - `GET /groups/:id`
    - `PUT /groups/:id`
    - `DELETE /groups/:id`

- `src/services/members.ts`
  - Убрать локальные операции.
  - Заменить на:
    - `GET /groups/:id/members`
    - `POST /groups/:id/members` с body `{email}` (по актуальной правке в спеке)
    - `DELETE /groups/:id/members/:uid`

- `src/pages/GroupDetail/GroupDetail.tsx`
  - Обновить обработчики добавления/удаления участников под новые методы сервиса.
  - Обрабатывать серверные коды ошибок (`403`, `409`) из контрактного формата.

## 4) Расходы

- `src/services/expenses.ts`
  - Удалить работу с `expenses`, `expenseParticipants`, `balancesStore`.
  - Удалить фронтовой пересчет балансов (`recalculateGroupBalances`, `calculateBalances`).
  - Заменить на endpoints:
    - `GET /groups/:id/expenses` (+query `page`, `limit`, `from_date`, `to_date`)
    - `POST /groups/:id/expenses`
    - `GET /groups/:id/expenses/:eid`
    - `PUT /groups/:id/expenses/:eid`
    - `DELETE /groups/:id/expenses/:eid`
    - `GET /groups/:id/balances`
    - `GET /groups/:id/balances/me`
    - `POST /groups/:id/balances/:bid/pay`

- `src/pages/GroupDetail/AddExpenseModal.tsx`
  - UI-расчет равномерного деления можно оставить только как удобный prefill.
  - Источник истины для валидации суммы/participants/payer должен быть backend.

- `src/pages/ExpenseDetail/EditExpenseModal.tsx`
  - Аналогично: локальный расчет только как draft на UI.
  - Финальная валидация и сохранение через `PUT /groups/:id/expenses/:eid`.

- `src/pages/ExpenseDetail/ExpenseDetail.tsx`
  - Проверить, что чтение/редактирование/удаление расхода идет через сервис с endpoint-ами спеки.

- `src/pages/Expenses/Expenses.tsx`
  - Привести список расходов к серверной пагинации и фильтрам (`from_date`, `to_date`).

## 5) Балансы и расчеты долгов

- `src/utils/calculateBalances.ts`
- `src/utils/calculateUserBalance.ts`
  - После миграции сделать deprecated/remove: расчет долгов по спеке выполняет backend (`DebtsCalculator`).

- `src/pages/Balances/Balances.tsx`
  - Вместо агрегации через циклы по всем группам + локальные вызовы мок-сервисов использовать ответы backend (`/balances`, `/balances/me`) через новый API-слой.

## 6) Дашборд и "недавние" данные

- `src/services/recent.ts`
  - Убрать выборку из локального массива `expenses`.
  - Либо:
    - использовать существующие server endpoints (`GET /groups/:id/expenses` и агрегировать на UI),
    - либо добавить отдельный backend endpoint для "recent" (если согласуете расширение спеки).

- `src/pages/Dashboard/Dashboard.tsx`
  - Перевести виджеты на реальные backend источники данных, убрать зависимость от мок-структур.

## 7) Типы DTO и контракты

- `src/types/*`
  - Разделить:
    - доменные UI-модели;
    - API DTO (request/response) строго под `backend_spec.md`.
  - Синхронизировать naming:
    - в API DTO использовать snake_case поля, если backend отдает snake_case;
    - либо зафиксировать маппинг в сервисном слое.

## 8) Общие требования при замене

- Все protected запросы отправлять с `Authorization: Bearer <JWT>`.
- Все ошибки приводить к единому контракту `{ error, code, field }`.
- На страницах, где есть ACL/конфликтные сценарии, отдельно обработать:
  - `401` (неавторизован),
  - `403` (нет доступа),
  - `409` (конфликт бизнес-правил).

## 9) Что считается временно допустимым до подключения backend

- Использование `src/mocks/db.ts`.
- Временные локальные вычисления/хранилище в сервисах.
- Временные экраны вне спецификации (`forgot/reset`, `terms`) до отдельного решения по продукту.
