import httpClient from "./httpClient";

export interface RoleDto {
  roleId: number;
  name: string;
}

export async function getRoles(): Promise<RoleDto[]> {
  const response = await httpClient.get<RoleDto[]>("/roles");
  return response.data;
}
