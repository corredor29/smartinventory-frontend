export function fmtCurrency(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * ==============================================================
 * ARCHIVO: currency.ts
 * UBICACIÓN: src/utils/currency.ts
 * ==============================================================
 *
 * PROPÓSITO
 *
 * Este archivo contiene funciones utilitarias encargadas de
 * dar formato a valores numéricos y fechas antes de mostrarlos
 * en la interfaz de usuario.
 *
 * Centralizar estas funciones evita repetir código en múltiples
 * componentes y garantiza que toda la aplicación muestre la
 * información con el mismo formato.
 *
 * Actualmente el archivo proporciona dos utilidades:
 *
 * • fmtCurrency()
 * • fmtDate()
 *
 * ====== */