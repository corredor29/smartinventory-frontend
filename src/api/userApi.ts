import httpClient from "./httpClient";

export interface UserDto {
  userId: number;
  name: string;
  email: string;
  roleId: number;
  roleName: string;
  customerId: number | null;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  roleId: number;
  customerId?: number | null;
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  roleId: number;
  password?: string;
}

export async function getUsers(): Promise<UserDto[]> {
  const response = await httpClient.get<UserDto[]>("/users");
  return response.data;
}

export async function getUserById(id: number): Promise<UserDto> {
  const response = await httpClient.get<UserDto>(`/users/${id}`);
  return response.data;
}

export async function createUser(data: CreateUserRequest): Promise<UserDto> {
  const response = await httpClient.post<UserDto>("/users", data);
  return response.data;
}

export async function updateUser(id: number, data: UpdateUserRequest): Promise<UserDto> {
  const response = await httpClient.put<UserDto>(`/users/${id}`, data);
  return response.data;
}

export async function deleteUser(id: number): Promise<void> {
  await httpClient.delete(`/users/${id}`);
}
