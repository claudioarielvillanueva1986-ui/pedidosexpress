import type {
  Category,
  LocalConfig,
  NavItem,
  PaymentsConfig,
  Product,
  ScheduleDay,
  ShippingConfig,
} from './types'

export const NAV: NavItem[] = [
  { id: 'inicio', name: 'Inicio', icon: '🏠', title: 'Inicio', subtitle: 'Resumen y configuración rápida.' },
  { id: 'pedidos', name: 'Pedidos', icon: '📋', title: 'Pedidos', subtitle: 'Pedidos que entraron, en preparación y entregados.' },
  { id: 'menu', name: 'Menú', icon: '🍔', title: 'Menú', subtitle: 'Gestioná categorías y productos.' },
  { id: 'local', name: 'Local', icon: '🏪', title: 'Configuración del local', subtitle: 'Marca, contacto y horarios de atención.' },
  { id: 'pagos', name: 'Métodos de pago', icon: '💳', title: 'Métodos de pago', subtitle: 'Qué medios aceptás y datos para transferir.' },
  { id: 'envio', name: 'Envío', icon: '🛵', title: 'Envío y entrega', subtitle: 'Modalidades, costos y zona de cobertura.' },
]

export const COLOR_PALETTE = ['#E54B2A', '#D62828', '#F4A261', '#2A9D8F', '#264653', '#6D28D9']

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'hamburguesas', name: 'Hamburguesas', emoji: '🍔' },
  { id: 'papas', name: 'Papas Fritas', emoji: '🍟' },
  { id: 'bebidas', name: 'Bebidas', emoji: '🥤' },
  { id: 'combos', name: 'Combos', emoji: '🍱' },
]

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'h1', categoryId: 'hamburguesas', name: 'Clásica del Barrio', desc: 'Smash 150g, cheddar, lechuga, tomate y salsa secreta.', price: 4500, img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80&auto=format&fit=crop', available: true },
  { id: 'h2', categoryId: 'hamburguesas', name: 'Doble Cheese', desc: 'Doble carne, doble cheddar fundido, pickles y dijon.', price: 6200, img: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&q=80&auto=format&fit=crop', available: true },
  { id: 'h3', categoryId: 'hamburguesas', name: 'Bacon BBQ', desc: 'Carne, panceta ahumada, BBQ casera y aros crispy.', price: 5800, img: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&q=80&auto=format&fit=crop', available: true },
  { id: 'h4', categoryId: 'hamburguesas', name: 'Veggie Garden', desc: 'Medallón de garbanzo, palta, rúcula y alioli.', price: 4800, img: 'https://images.unsplash.com/photo-1525059696034-4967a729002e?w=400&q=80&auto=format&fit=crop', available: false },
  { id: 'p1', categoryId: 'papas', name: 'Papas Clásicas', desc: 'Porción generosa, sal marina, doble cocción.', price: 2500, img: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80&auto=format&fit=crop', available: true },
  { id: 'p2', categoryId: 'papas', name: 'Papas Cheddar & Bacon', desc: 'Cubiertas con cheddar derretido y panceta crocante.', price: 3800, img: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&q=80&auto=format&fit=crop', available: true },
  { id: 'p3', categoryId: 'papas', name: 'Papas Rústicas', desc: 'Con cáscara, romero fresco y ajo confitado.', price: 2800, img: 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=400&q=80&auto=format&fit=crop', available: true },
  { id: 'b1', categoryId: 'bebidas', name: 'Gaseosa línea Coca', desc: 'Coca, Sprite o Fanta · botella 500ml.', price: 1800, img: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&q=80&auto=format&fit=crop', available: true },
  { id: 'b2', categoryId: 'bebidas', name: 'Limonada de la casa', desc: 'Con menta fresca y jengibre · 500ml.', price: 2200, img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80&auto=format&fit=crop', available: true },
  { id: 'b3', categoryId: 'bebidas', name: 'Cerveza artesanal IPA', desc: 'IPA local 473ml · final seco.', price: 3200, img: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&q=80&auto=format&fit=crop', available: true },
  { id: 'b4', categoryId: 'bebidas', name: 'Agua mineral', desc: '500ml con o sin gas.', price: 1200, img: 'https://images.unsplash.com/photo-1564419320461-6870880221ad?w=400&q=80&auto=format&fit=crop', available: true },
  { id: 'c1', categoryId: 'combos', name: 'Combo Clásico', desc: 'Clásica del Barrio + Papas + Bebida 500ml.', price: 7500, img: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&q=80&auto=format&fit=crop', available: true },
  { id: 'c2', categoryId: 'combos', name: 'Combo Doble Cheese', desc: 'Doble Cheese + Papas Cheddar + Bebida.', price: 9800, img: 'https://images.unsplash.com/photo-1606131731446-5568d87113aa?w=400&q=80&auto=format&fit=crop', available: true },
  { id: 'c3', categoryId: 'combos', name: 'Combo Familiar', desc: '2 hamburguesas + 2 papas + 2 bebidas.', price: 14500, img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80&auto=format&fit=crop', available: true },
]

export const INITIAL_LOCAL: LocalConfig = {
  name: 'Hamburguesería La Esquina',
  slogan: 'Hambre con prisa, listos en 25′.',
  logo: '🔥',
  primaryColor: '#E54B2A',
  whatsapp: '5491100000000',
  phone: '011 4444-5555',
  email: 'hola@laesquina.com',
  address: 'Av. Corrientes 1234, CABA',
}

export const INITIAL_SCHEDULE: ScheduleDay[] = [
  { day: 'Lunes', open: true, from: '12:00', to: '23:00' },
  { day: 'Martes', open: true, from: '12:00', to: '23:00' },
  { day: 'Miércoles', open: true, from: '12:00', to: '23:00' },
  { day: 'Jueves', open: true, from: '12:00', to: '23:30' },
  { day: 'Viernes', open: true, from: '12:00', to: '01:00' },
  { day: 'Sábado', open: true, from: '12:00', to: '01:00' },
  { day: 'Domingo', open: false, from: '12:00', to: '23:00' },
]

export const INITIAL_PAYMENTS: PaymentsConfig = {
  cashEnabled: true,
  transferEnabled: true,
  alias: 'esquina.burger.mp',
  cbu: '0000003100074558920000',
  holder: 'Martín Gutiérrez',
  message: 'Una vez recibido el comprobante, salimos para tu casa.',
  paymentLink: '',
}

export const INITIAL_SHIPPING: ShippingConfig = {
  deliveryEnabled: true,
  pickupEnabled: true,
  cost: 800,
  freeFrom: 12000,
  zone: 'Llevamos a Palermo, Villa Crespo y Almagro. Hasta 4km del local.',
  etaDelivery: '25-35 min',
  etaPickup: '15 min',
}
