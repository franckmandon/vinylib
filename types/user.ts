export interface User {
  id: string;
  email: string;
  username: string;
  password: string; // Hashed password
  createdAt: string;
  updatedAt: string;
}

export interface UserPublic {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface LoginData {
  emailOrUsername: string;
  password: string;
}

