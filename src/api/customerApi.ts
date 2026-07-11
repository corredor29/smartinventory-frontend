import httpClient from "./httpClient";

export interface CustomerDto {
  customerId: number;
  name: string;
  email: string | null;
  phone: string | null;
  documentNumber: string | null;
}

export interface CustomerRequest {
  name: string;
  email?: string | null;
  phone?: string | null;
  documentNumber?: string | null;
}

function cleanOptional(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Perfil del cliente autenticado (para prefills del chat). */
export async function getMyCustomer(): Promise<CustomerDto> {
  const response = await httpClient.get<CustomerDto>("/customers/me");
  return response.data;
}

export async function getCustomers(): Promise<CustomerDto[]> {
  const response = await httpClient.get<CustomerDto[]>("/customers");
  return response.data;
}

export async function getCustomerById(id: number): Promise<CustomerDto> {
  const response = await httpClient.get<CustomerDto>(`/customers/${id}`);
  return response.data;
}

export async function createCustomer(data: CustomerRequest): Promise<CustomerDto> {
  const response = await httpClient.post<CustomerDto>("/customers", {
    name: data.name.trim(),
    email: cleanOptional(data.email),
    phone: cleanOptional(data.phone),
    documentNumber: cleanOptional(data.documentNumber),
  });
  return response.data;
}

export async function updateCustomer(id: number, data: CustomerRequest): Promise<CustomerDto> {
  const response = await httpClient.put<CustomerDto>(`/customers/${id}`, {
    name: data.name.trim(),
    email: cleanOptional(data.email),
    phone: cleanOptional(data.phone),
    documentNumber: cleanOptional(data.documentNumber),
  });
  return response.data;
}

export async function deleteCustomer(id: number): Promise<void> {
  await httpClient.delete(`/customers/${id}`);
}