import { Sale } from '../types';

export class ReportService {
  static getOverviewMetrics(sales: Sale[]) {
    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
    const totalCost = sales.reduce((sum, s) => sum + s.cost, 0);
    const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);
    const averageTicket = sales.length > 0 ? Math.round(totalRevenue / sales.length) : 0;
    
    return {
      totalRevenue,
      totalCost,
      totalProfit,
      averageTicket,
      totalSalesCount: sales.length
    };
  }

  static getSalesByPaymentMethod(sales: Sale[]) {
    const counts = { Efectivo: 0, Tarjeta: 0, Transf: 0, Credito: 0 };
    const amounts = { Efectivo: 0, Tarjeta: 0, Transf: 0, Credito: 0 };

    sales.forEach(s => {
      const m = s.method || 'Efectivo';
      if (counts[m] !== undefined) {
        counts[m]++;
        amounts[m] += s.total;
      }
    });

    return [
      { name: 'Efectivo', value: amounts.Efectivo, count: counts.Efectivo },
      { name: 'Tarjeta', value: amounts.Tarjeta, count: counts.Tarjeta },
      { name: 'Transf. Bancaria', value: amounts.Transf, count: counts.Transf },
      { name: 'Crédito Cli.', value: amounts.Credito, count: counts.Credito }
    ];
  }

  static getTopBestSellingProducts(sales: Sale[]) {
    const itemMap: Record<string, { qty: number; value: number }> = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!itemMap[item.name]) {
          itemMap[item.name] = { qty: 0, value: 0 };
        }
        itemMap[item.name].qty += item.qty;
        itemMap[item.name].value += item.qty * item.price;
      });
    });

    return Object.entries(itemMap)
      .map(([name, data]) => ({ name, qty: data.qty, value: data.value }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }
}
