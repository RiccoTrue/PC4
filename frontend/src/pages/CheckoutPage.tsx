import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyCart, type CartItem, type CartProduct } from '../services/cart';
import { getProductById } from '../services/products';

// Extendemos CartItem para incluir los campos adicionales que necesitamos
interface Product extends Omit<CartItem, 'producto'> {
  name: string;
  price: number;
  image?: string | null;  // Acepta string, null o undefined
  producto: CartProduct;
}

interface FormData {
  nombre: string;
  apellido: string;
  email: string;
  direccion: string;
  ciudad: string;
  codigoPostal: string;
  metodoPago: string;
}

const CheckoutPage: React.FC = () => {
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellido: '',
    email: '',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
    metodoPago: 'tarjeta-credito',
  });

  // Cargar los ítems del carrito
  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoading(true);
        // Necesitamos el token de autenticación
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const cartResponse = await getMyCart(token);
        
        // Obtener detalles completos de los productos
        const itemsWithDetails = await Promise.all(
          cartResponse.map(async (item) => {
            try {
              const productDetails = await getProductById(item.id_producto.toString());
              return {
                ...item,
                id: item.id_producto, // Asegurar que tenemos un id
                name: productDetails.nombre,
                price: parseFloat(productDetails.precio), // Convertir a número
                image: productDetails.imagen_principal,
                cantidad: item.cantidad // Asegurar que tenemos la cantidad
              };
            } catch (error) {
              console.error('Error al cargar detalles del producto:', error);
              return {
                ...item,
                id: item.id_producto,
                name: 'Producto no disponible',
                price: 0,
                image: '',
                cantidad: item.cantidad
              };
            }
          })
        );
        
        setCartItems(itemsWithDetails);
      } catch (err) {
        setError('Error al cargar el carrito');
        console.error('Error al cargar el carrito:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, []);

  // Calcular el total del carrito
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.price * item.cantidad);
    }, 0);
  };

  // Limpiar el carrito (simulado ya que no hay un método clear en el servicio)
  const clearCart = async () => {
    // En una implementación real, aquí se haría una llamada al backend
    // para limpiar el carrito
    setCartItems([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the order to your backend
    console.log('Order submitted:', { ...formData, items: cartItems });
    
    // Clear cart and redirect to confirmation page
    clearCart();
    navigate('/order-confirmation');
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Tu carrito está vacío</h1>
        <p className="mb-4">No hay artículos en tu carrito para proceder al pago.</p>
        <button
          onClick={() => navigate('/products')}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Seguir comprando
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>
      
      <div className="grid md:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Información de contacto</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    id="apellido"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Dirección de envío</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ciudad" className="block text-sm font-medium text-gray-700 mb-1">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      id="ciudad"
                      name="ciudad"
                      value={formData.ciudad}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="codigoPostal" className="block text-sm font-medium text-gray-700 mb-1">
                      Código postal
                    </label>
                    <input
                      type="text"
                      id="codigoPostal"
                      name="codigoPostal"
                      value={formData.codigoPostal}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Método de pago</h2>
              <div className="space-y-4">
                {/* Tarjeta de crédito/débito */}
                <div className={`border-2 rounded-lg p-4 transition-colors ${formData.metodoPago === 'tarjeta-credito' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      id="tarjeta-credito"
                      name="metodoPago"
                      value="tarjeta-credito"
                      checked={formData.metodoPago === 'tarjeta-credito'}
                      onChange={handleInputChange}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="block font-medium text-gray-900">Tarjeta de crédito/débito</span>
                        <div className="flex space-x-2">
                          <span className="text-gray-400">•••• •••• •••• ••••</span>
                          <svg className="w-8 h-5" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" fill="#000"></path>
                            <path d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32" fill="#006FCF"></path>
                            <path d="M13.9 16.5h-2.3V7.5h2.3v9zm5.4 0h-2.3V7.5h2.3v9zm5.4 0h-2.3V7.5h2.3v9z" fill="#fff"></path>
                          </svg>
                        </div>
                      </div>
                      {formData.metodoPago === 'tarjeta-credito' && (
                        <div className="mt-3 space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Número de tarjeta</label>
                            <input
                              type="text"
                              placeholder="1234 5678 9012 3456"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Vencimiento</label>
                              <input
                                type="text"
                                placeholder="MM/AA"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                              <input
                                type="text"
                                placeholder="123"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* PayPal */}
                <div className={`border-2 rounded-lg p-4 transition-colors ${formData.metodoPago === 'paypal' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      id="paypal"
                      name="metodoPago"
                      value="paypal"
                      checked={formData.metodoPago === 'paypal'}
                      onChange={handleInputChange}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="block font-medium text-gray-900">PayPal</span>
                        <svg className="w-12 h-8" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000-svg">
                          <path d="M9.1 16.9H7.4c-.1 0-.2-.1-.2-.2l-1.3-8.2c0-.1 0-.2.1-.2h2.9c.1 0 .2 0 .2.1l.8 5.3 4.4-5.4c.1-.1.2-.1.3-.1h3.2c.1 0 .2 0 .2.1l-1.6 10.1c0 .1-.1.2-.2.2h-2.5c-.1 0-.2-.1-.2-.2l-.1-.7-1.8 2.3c0 .1-.1.1-.2.1H9.2c-.1 0-.2-.1-.1-.2l1.8-3.3-1.8-2.5z" fill="#253B80"/>
                          <path d="M22.5 16.9h-2.7c-.1 0-.2-.1-.2-.2l-1.3-8.2c0-.1 0-.2.1-.2h2.9c.1 0 .2 0 .2.1l.8 5.3 4.4-5.4c.1-.1.2-.1.3-.1h3.2c.1 0 .2 0 .2.1l-1.6 10.1c0 .1-.1.2-.2.2h-2.5c-.1 0-.2-.1-.2-.2l-.1-.7-1.8 2.3c0 .1-.1.1-.2.1h-1.5c-.1 0-.1 0-.1-.1l.1-1.1z" fill="#179BD7"/>
                          <path d="M36.9 16.9h-2.7c-.1 0-.2-.1-.2-.2l-1.3-8.2c0-.1 0-.2.1-.2h2.9c.1 0 .2 0 .2.1l.8 5.3 4.4-5.4c.1-.1.2-.1.3-.1h3.2c.1 0 .2 0 .2.1l-1.6 10.1c0 .1-.1.2-.2.2h-2.5c-.1 0-.2-.1-.2-.2l-.1-.7-1.8 2.3c0 .1-.1.1-.2.1h-1.5c-.1 0-.1 0-.1-.1l.1-1.1z" fill="#222D65"/>
                          <path d="M51.3 16.9h-2.7c-.1 0-.2-.1-.2-.2l-1.3-8.2c0-.1 0-.2.1-.2h2.9c.1 0 .2 0 .2.1l.8 5.3 4.4-5.4c.1-.1.2-.1.3-.1h3.2c.1 0 .2 0 .2.1l-1.6 10.1c0 .1-.1.2-.2.2h-2.5c-.1 0-.2-.1-.2-.2l-.1-.7-1.8 2.3c0 .1-.1.1-.2.1h-1.5c-.1 0-.1 0-.1-.1l.1-1.1z" fill="#253B80"/>
                        </svg>
                      </div>
                      {formData.metodoPago === 'paypal' && (
                        <p className="mt-2 text-sm text-gray-600">Serás redirigido a PayPal para completar tu pago de manera segura.</p>
                      )}
                    </div>
                  </label>
                </div>

                {/* Transferencia bancaria */}
                <div className={`border-2 rounded-lg p-4 transition-colors ${formData.metodoPago === 'transferencia-bancaria' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      id="transferencia-bancaria"
                      name="metodoPago"
                      value="transferencia-bancaria"
                      checked={formData.metodoPago === 'transferencia-bancaria'}
                      onChange={handleInputChange}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="block font-medium text-gray-900">Transferencia bancaria</span>
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.97 1.5 2.98 3.57 3.48 1.82.47 2.34 1.11 2.34 1.87 0 .5-.36 1.3-2.1 1.3-1.5 0-2.23-.69-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.3 2.72-1.04 2.73-2.83 0-2.09-1.55-3.08-3.66-3.54z" fill="#4CAF50"/>
                        </svg>
                      </div>
                      {formData.metodoPago === 'transferencia-bancaria' && (
                        <div className="mt-2 text-sm text-gray-600">
                          <p className="mb-2">Realiza la transferencia a nuestra cuenta bancaria:</p>
                          <div className="bg-gray-100 p-3 rounded-md">
                            <p className="font-mono">Banco: Tu Banco S.A.</p>
                            <p className="font-mono">Titular: TechMate EIRL</p>
                            <p className="font-mono">CUENTA: 123-456789-0-01</p>
                            <p className="font-mono">CCI: 00212300456789010123</p>
                          </div>
                          <p className="mt-2">Una vez realizado el pago, envíanos el comprobante a pagos@techmate.com</p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Realizar pedido
              </button>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Resumen del pedido</h2>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={`${item.id_carrito}-${item.id_producto}`} className="flex justify-between items-start border-b pb-4">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-md mr-4 overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">Sin imagen</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-500">Cantidad: {item.cantidad}</p>
                      <p className="text-sm text-gray-500">Precio: ${item.price.toFixed(2)} c/u</p>
                    </div>
                  </div>
                  <div className="font-medium">
                    ${(item.price * item.cantidad).toFixed(2)}
                  </div>
                </div>
              ))}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío</span>
                  <span>Gratis</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Total</span>
                  <span>${getCartTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;