export type Role = 'user' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  interests: string[];
  createdAt: string;
}

export interface Note {
  _id: string;
  title: string;
  content: string;
  owner: string | { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  _id: string;
  title: string;
  body: string;
  author: string | { _id: string; name: string };
  createdAt: string;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface ApiErrorBody {
  error: { message: string; details?: unknown };
}
