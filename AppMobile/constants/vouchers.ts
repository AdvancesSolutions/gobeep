export interface Voucher {
  id: number;
  brand: string;
  product: string;
  cost: number;
  stock: number;
  redeemed: number;
  status: 'Ativo' | 'Esgotando' | 'Esgotado';
}

export const initialVouchers: Voucher[] = [
  { id: 1, brand: 'Burger King', product: 'Whopper + Fritas', cost: 500, stock: 10000, redeemed: 4520, status: 'Ativo' },
  { id: 2, brand: 'iFood', product: 'Cupom R$ 20', cost: 1000, stock: 5000, redeemed: 4800, status: 'Esgotando' },
  { id: 3, brand: 'Spotify', product: '1 Mês Premium', cost: 1500, stock: 2000, redeemed: 150, status: 'Ativo' },
];
