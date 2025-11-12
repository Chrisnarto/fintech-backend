/**
 * Interfaz base para proveedores de base de datos
 * Permite abstraer las operaciones CRUD y cambiar de motor sin modificar la lógica de negocio
 */
export interface DatabaseProvider {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  find(collection: string, query?: any): Promise<any[]>;
  findOne(collection: string, id: string): Promise<any | null>;
  insert(collection: string, data: any): Promise<any>;
  update(collection: string, id: string, data: any): Promise<any>;
  delete(collection: string, id: string): Promise<void>;
  query(collection: string, customQuery: any): Promise<any>;
}

