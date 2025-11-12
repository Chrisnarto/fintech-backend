/**
 * Utilidades para conversión entre camelCase y snake_case
 * Útil para bases de datos que usan snake_case (PostgreSQL, Supabase)
 */

/**
 * Convierte camelCase a snake_case
 * @example toCamelCase("userId") => "user_id"
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convierte snake_case a camelCase
 * @example toCamelCase("user_id") => "userId"
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convierte todas las claves de un objeto de camelCase a snake_case
 * Funciona recursivamente con objetos y arrays anidados
 * 
 * @example
 * convertKeysToSnakeCase({ userId: "123", createdAt: "2024..." })
 * // => { user_id: "123", created_at: "2024..." }
 */
export function convertKeysToSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  // No convertir objetos especiales (Date, RegExp, etc.)
  if (obj instanceof Date || obj instanceof RegExp) return obj;
  
  if (Array.isArray(obj)) return obj.map(item => convertKeysToSnakeCase(item));

  const converted: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = toSnakeCase(key);
      converted[snakeKey] = convertKeysToSnakeCase(obj[key]);
    }
  }
  return converted;
}

/**
 * Convierte todas las claves de un objeto de snake_case a camelCase
 * Funciona recursivamente con objetos y arrays anidados
 * 
 * @example
 * convertKeysToCamelCase({ user_id: "123", created_at: "2024..." })
 * // => { userId: "123", createdAt: "2024..." }
 */
export function convertKeysToCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  // No convertir objetos especiales (Date, RegExp, etc.)
  if (obj instanceof Date || obj instanceof RegExp) return obj;
  
  if (Array.isArray(obj)) return obj.map(item => convertKeysToCamelCase(item));

  const converted: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = toCamelCase(key);
      converted[camelKey] = convertKeysToCamelCase(obj[key]);
    }
  }
  return converted;
}

