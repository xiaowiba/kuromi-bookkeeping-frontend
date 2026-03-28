const TOKEN_KEY = 'token'
const ENTRY_LOGIN_KEY = 'entry-login-key'
const ENTRY_LOGIN_ENABLED_KEY = 'entry-login-enabled'

const isLogin = () => {
  return !!localStorage.getItem(TOKEN_KEY)
}

const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token)
}

const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY)
}

const getEntryLoginKey = () => {
  return localStorage.getItem(ENTRY_LOGIN_KEY)
}

const setEntryLoginKey = (entryKey: string) => {
  localStorage.setItem(ENTRY_LOGIN_KEY, entryKey)
}

const clearEntryLoginKey = () => {
  localStorage.removeItem(ENTRY_LOGIN_KEY)
}

const getEntryLoginEnabled = () => {
  return localStorage.getItem(ENTRY_LOGIN_ENABLED_KEY) === 'true'
}

const setEntryLoginEnabled = (enabled: boolean) => {
  localStorage.setItem(ENTRY_LOGIN_ENABLED_KEY, String(enabled))
}

const clearEntryLoginEnabled = () => {
  localStorage.removeItem(ENTRY_LOGIN_ENABLED_KEY)
}

const clearEntryLoginState = () => {
  clearEntryLoginKey()
  clearEntryLoginEnabled()
}

export {
  clearEntryLoginEnabled,
  clearEntryLoginKey,
  clearEntryLoginState,
  clearToken,
  getEntryLoginEnabled,
  getEntryLoginKey,
  getToken,
  isLogin,
  setEntryLoginEnabled,
  setEntryLoginKey,
  setToken,
}
