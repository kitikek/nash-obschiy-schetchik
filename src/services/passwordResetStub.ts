/**
 * Сброс пароля не описан в backend_spec — отдельный flow до появления API.
 */
export const requestPasswordReset = async (_email: string): Promise<{ success: boolean }> => {
  throw new Error(
    "Восстановление пароля через сервер пока недоступно. Обратитесь к администратору или используйте смену пароля в профиле."
  )
}

export const resetPassword = async (_token: string, _newPassword: string): Promise<void> => {
  throw new Error("Сброс пароля по ссылке пока не подключён к API.")
}
