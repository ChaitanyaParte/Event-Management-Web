export const ROLES = ['student', 'organizer', 'admin'];

const storageKey = (role) => `campusx_token_${role}`;

export const getToken = (role) => localStorage.getItem(storageKey(role));
export const setToken = (role, token) => localStorage.setItem(storageKey(role), token);
export const clearToken = (role) => localStorage.removeItem(storageKey(role));
export const activeRoles = () => ROLES.filter((role) => getToken(role));

export const parseToken = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

export const dashboardPath = (role) => `/${role}`;

export const userId = (role) => parseToken(getToken(role))?.id;
