import httpClient from "./httpClient";

export interface WeeklySalesPoint {
  day: string;
  manual: number;
  chatbot: number;
}

export interface CategorySales {
  categoryName: string;
  value: number;
}

export interface RecentInvoice {
  invoiceNumber: string;
  customerName: string;
  issueDate: string;
  total: number;
}

export interface DashboardMetrics {
  totalProducts: number;
  dailySalesTotal: number;
  lowStockCount: number;
  chatbotSalesCount: number;
  weeklySales: WeeklySalesPoint[];
  categorySales: CategorySales[];
  recentInvoices: RecentInvoice[];
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const response = await httpClient.get<DashboardMetrics>("/dashboard/metrics");
  return response.data;
}