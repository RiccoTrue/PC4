import { apiRequest } from './api';

export interface OrderItem {
  id: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  nombre_producto: string;
  imagen_principal?: string;
}

export interface Order {
  id_pedido: number;
  fecha_creacion: string;
  estado: string;
  total: number;
  subtotal: number;
  impuestos: number;
  items: OrderItem[];
  direccion_entrega: {
    direccion: string;
    ciudad: string;
    departamento: string;
    codigo_postal: string;
  };
}

export async function getMyOrders(): Promise<Order[]> {
  return apiRequest<Order[]>('/api/orders/my-orders');
}

export async function getOrderDetails(orderId: number): Promise<Order> {
  return apiRequest<Order>(`/api/orders/${orderId}`);
}
