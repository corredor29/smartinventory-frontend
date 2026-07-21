/**
 * Limpia el texto del bot para el chat: sin markdown de imagenes ni URLs largas.
 * Las imagenes van en las tarjetas de producto (products[]), no en el bubble.
 */

const SEARCH_STOP_WORDS = new Set([
  'quiero',
  'quisiera',
  'gustaria',
  'gustaría',
  'busco',
  'necesito',
  'un',
  'una',
  'unos',
  'unas',
  'el',
  'la',
  'los',
  'las',
  'de',
  'del',
  'para',
  'por',
  'me',
  'mi',
  'con',
  'y',
  'o',
  'que',
  'como',
  'hola',
  'buenas',
  'buen',
  'dia',
  'tarde',
  'noche',
  'comprar',
  'compra',
  'producto',
  'productos',
  'favor',
  'porfavor',
  'algo',
  'tiene',
  'tienen',
  'hay',
  'confirmo',
  'dale',
  'si',
  'sí',
  'ok',
  'okay',
  'claro',
]);

const BRAND_RE =
  /lenovo|asus|acer|dell|hp|msi|apple|samsung|logitech|razer|corsair|kingston|laptop|teclado|mouse|monitor|ram|ssd|audifonos|audifonos/i;

const SHORT_TARJETAS_MSG =
  'Encontre estas opciones para ti. Elige en las tarjetas de abajo o dime cual te interesa.';

/**
 * Extrae keywords de busqueda desde un mensaje natural
 * (misma logica que Extract Search Query en n8n v6.1).
 */
export function extractSearchQuery(message: string): string {
  const lower = String(message || '')
    .trim()
    .toLowerCase();
  if (!lower) return '';

  const tokens = lower
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const keep = (t: string) =>
    !SEARCH_STOP_WORDS.has(t) &&
    (t.length >= 3 || /^\d+$/.test(t) || /^[a-z]*\d+[a-z\d]*$/i.test(t));

  let keywords = tokens.filter(keep);
  const brand = lower.match(BRAND_RE);
  if (brand) {
    const b = brand[0]
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    if (!keywords.includes(b)) keywords = [b, ...keywords];
  }
  keywords = [...new Set(keywords)];
  return keywords.slice(0, 5).join(' ');
}

/**
 * Afina resultados: si el nombre contiene TODAS las keywords, solo esos.
 * Evita "4 Lenovos" cuando el usuario pidio "lenovo legion 5".
 */
export function refineProductsByQuery<T extends { name: string; description?: string | null }>(
  products: T[],
  query: string
): T[] {
  if (!products.length) return products;
  const tokens = extractSearchQuery(query)
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return products;

  const allInName = products.filter((p) => {
    const name = String(p.name || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return tokens.every((t) => name.includes(t));
  });
  if (allInName.length > 0) return allInName;

  if (tokens.length >= 2) {
    const allInText = products.filter((p) => {
      const hay = `${p.name || ''} ${p.description || ''}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return tokens.every((t) => hay.includes(t));
    });
    if (allInText.length > 0) return allInText;
  }

  return products;
}

export function formatFoundProductsMessage(count: number, query: string): string {
  const q = query.trim();
  if (count <= 0) {
    return q
      ? `No encontre productos para "${q}". Prueba con otra marca o modelo.`
      : 'No encontre productos. Prueba con otra marca o modelo.';
  }
  if (count === 1) {
    return q
      ? `Encontre el producto que buscas para "${q}". Elige en la tarjeta o dime si quieres comprarlo.`
      : 'Encontre 1 producto. Elige en la tarjeta o dime si quieres comprarlo.';
  }
  return q
    ? `Encontre ${count} opcion(es) para "${q}". Elige en las tarjetas o dime cual te interesa.`
    : `Encontre ${count} opcion(es). Elige en las tarjetas o dime cual te interesa.`;
}

export function sanitizeBotText(
  text: string,
  options?: { hasProducts?: boolean }
): string {
  let t = String(text || '');

  t = t.replace(/!\[[^\]]*\]\([^)]*\)/gi, '');
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  t = t.replace(/https?:\/\/\S+\.(?:png|jpe?g|webp|gif|svg)(?:\?\S*)?/gi, '');
  t = t.replace(/^\s*[-*•]?\s*Imagen\s*:?\s*$/gim, '');
  t = t.replace(/^\s*[-*•]\s*$/gm, '');
  t = t.replace(/\n{3,}/g, '\n\n').trim();

  const hasProducts = !!options?.hasProducts;
  const looksLikeCatalog =
    /\*\*Precio\*\*|Stock disponible|Descripci[oó]n:/i.test(text) ||
    (/(?:^|\n)\s*\d+\.\s+\*\*/.test(text) && t.length > 280);

  if (hasProducts && /procesando tu solicitud|repetir que producto/i.test(t)) {
    return SHORT_TARJETAS_MSG;
  }

  if (hasProducts && (looksLikeCatalog || t.length > 420)) {
    return SHORT_TARJETAS_MSG;
  }

  if (!hasProducts && looksLikeCatalog && t.length > 420) {
    const lines = t.split('\n').filter((line) => {
      const s = line.trim();
      if (!s) return false;
      if (/^https?:\/\//i.test(s)) return false;
      return true;
    });
    t = lines.join('\n').trim();
  }

  return t;
}

/** Partes para renderizar **negrita** simple sin markdown completo. */
export function splitBoldSegments(text: string): Array<{ bold: boolean; text: string }> {
  const segments: Array<{ bold: boolean; text: string }> = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      segments.push({ bold: false, text: text.slice(last, m.index) });
    }
    segments.push({ bold: true, text: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    segments.push({ bold: false, text: text.slice(last) });
  }
  if (segments.length === 0) {
    segments.push({ bold: false, text });
  }
  return segments;
}
