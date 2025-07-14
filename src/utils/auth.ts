// utils/auth.ts
export const getAuth = () => {
  const stored = localStorage.getItem("auth");
  return stored ? JSON.parse(stored) : null;
};

export const setAuth = (authData: { token: string; role: string; email: string }) => {
  localStorage.setItem("auth", JSON.stringify(authData));
};

export const isAuthenticated = () => {
  return !!getAuth()?.token;
};
