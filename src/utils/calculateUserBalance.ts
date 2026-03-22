/**
 * @deprecated Используйте поле `my_balance` из `GET /groups`.
 */
import type { Group } from "../types/group"

export function calculateUserBalance(_group: Group, _userId: number): number {
  return 0
}
