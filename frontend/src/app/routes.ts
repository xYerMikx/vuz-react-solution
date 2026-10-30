export const routes = {
  home: "/",
  login: "/login",
  register: "/register",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
