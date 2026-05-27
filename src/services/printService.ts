import { Sale, CartItem } from '../types';

export interface ThermalReceiptData {
  title: string;
  subtitle: string;
  timestamp: string;
  cashier: string;
  items: { name: string; qty: number; price: number; note?: string }[];
  subtotal: number;
  discount: number;
  tax: number;
  tip?: number;
  total: number;
  paymentMethod: string;
  clientName: string;
  clientNit: string;
  invoiceId: string;
  tableId: string;
}

export class ThermalPrinterService {
  // Generate representation of ESC/POS Commands (raw bytes logic)
  static generateRawESCPOS(r: ThermalReceiptData, ticketSize: '58mm' | '80mm' = '80mm'): string {
    const ESC = '\x1B';
    const GS = '\x1D';
    const LF = '\n';
    
    // Set widths: 32 chars for 58mm, 48 chars for 80mm
    const maxChars = ticketSize === '58mm' ? 32 : 48;
    const itemWidth = ticketSize === '58mm' ? 14 : 26;
    const priceWidth = ticketSize === '58mm' ? 8 : 12;

    const separator = '-'.repeat(maxChars);
    let bin = '';
    
    // ESC @ - Initialize printer
    bin += ESC + '@';
    // ESC a 1 - Center alignment
    bin += ESC + 'a' + '\x01';
    
    // Double width & height for business logo representation
    bin += ESC + '!' + '\x38' + '  [ ' + r.title + ' ]  ' + LF;
    bin += ESC + '!' + '\x00' + r.subtitle + LF;
    bin += 'NIT: ' + r.clientNit + LF;
    bin += 'TEL: (601) 456-1234' + LF;
    bin += separator + LF;
    
    // Left alignment
    bin += ESC + 'a' + '\x00';
    bin += `FACTURA: ${r.invoiceId}`.padEnd(maxChars) + LF;
    bin += `FECHA  : ${r.timestamp}`.padEnd(maxChars) + LF;
    bin += `MESA   : ${r.tableId}`.padEnd(maxChars) + LF;
    bin += `CAJERO : ${r.cashier}`.padEnd(maxChars) + LF;
    bin += `CLIENTE: ${r.clientName}`.substring(0, maxChars) + LF;
    bin += separator + LF;
    bin += 'CANT PRODUCTO'.padEnd(itemWidth) + ' TOTAL'.padStart(priceWidth) + LF;
    bin += separator + LF;
    
    r.items.forEach(item => {
      const qtyStr = String(item.qty).padEnd(4, ' ');
      let nameStr = item.name.substring(0, itemWidth - 4);
      if (item.name.length < (itemWidth - 4)) {
        nameStr = nameStr.padEnd(itemWidth - 4, ' ');
      }
      const totalItem = (item.price * item.qty).toLocaleString('es-CO');
      const priceStr = ('$' + totalItem).padStart(priceWidth - 1, ' ');
      
      bin += qtyStr + nameStr + ' ' + priceStr + LF;
      if (item.note) {
        bin += `   * NOTA: ${item.note}`.substring(0, maxChars) + LF;
      }
    });
    
    bin += separator + LF;
    bin += `SUBTOTAL:`.padEnd(maxChars - priceWidth) + ('$' + Math.round(r.subtotal).toLocaleString('es-CO')).padStart(priceWidth) + LF;
    bin += `DESC:`.padEnd(maxChars - priceWidth) + ('$' + Math.round(r.discount).toLocaleString('es-CO')).padStart(priceWidth) + LF;
    bin += `IMPUESTOS:`.padEnd(maxChars - priceWidth) + ('$' + Math.round(r.tax).toLocaleString('es-CO')).padStart(priceWidth) + LF;
    if (r.tip) {
      bin += `PROPINA:`.padEnd(maxChars - priceWidth) + ('$' + Math.round(r.tip).toLocaleString('es-CO')).padStart(priceWidth) + LF;
    }
    bin += ESC + '!' + '\x10'; // Double height
    bin += `TOTAL:`.padEnd(maxChars - priceWidth) + ('$' + Math.round(r.total).toLocaleString('es-CO')).padStart(priceWidth) + LF;
    bin += ESC + '!' + '\x00'; // Reset styling
    bin += separator + LF;
    bin += `METODO PAGO: ${r.paymentMethod}` + LF;
    
    // QR Code generation sequence command for general ticket validation
    bin += LF;
    bin += ESC + 'a' + '\x01'; // Center QR
    bin += '--- CODIGO QR VALIDACION ---' + LF;
    // GS ( k - Command for QR code generation
    bin += GS + '(' + 'k' + '\x04' + '\x00' + '\x31' + '\x41' + '\x32' + '\x00'; // QR code model
    bin += GS + '(' + 'k' + '\x03' + '\x00' + '\x31' + '\x43' + '\x03'; // Size parameter
    bin += GS + '(' + 'k' + '\x03' + '\x00' + '\x31' + '\x45' + '\x30'; // Error correction level
    const qrData = `LUAL-POS::${r.invoiceId}::TOTAL::${r.total}`;
    const len = qrData.length + 3;
    const pL = len % 256;
    const pH = Math.floor(len / 256);
    bin += GS + '(' + 'k' + String.fromCharCode(pL) + String.fromCharCode(pH) + '\x31' + '\x50' + '\x30' + qrData; // Send QR characters data
    bin += GS + '(' + 'k' + '\x03' + '\x00' + '\x31' + '\x51' + '\x30'; // Render QR command
    bin += LF;

    bin += 'TE INVITAMOS A REGRESAR PRONTO' + LF;
    bin += 'LUAL POS GASTRO ENTERPRISE' + LF;
    bin += 'Soporte: pos.lualgastro.com' + LF;
    
    bin += LF + LF + LF + LF;
    // ESC m - Partial cutter / Automatic cutter
    bin += ESC + 'm';
    
    return bin;
  }

  // Comanda system for kitchen ticket printing
  static compileKitchenComanda(tableId: string, items: { name: string; qty: number; note?: string }[], index: number = 1, ticketSize: '58mm' | '80mm' = '80mm'): string {
    const LF = '\n';
    const separator = '='.repeat(ticketSize === '58mm' ? 32 : 48);
    let txt = '';
    txt += '=== COMANDA DE COCINA ===' + LF;
    txt += `MESA   : ${tableId}` + LF;
    txt += `HORA   : ${new Date().toLocaleTimeString('es-CO')}` + LF;
    txt += `PEDIDO : #C-${index}` + LF;
    txt += separator + LF;
    items.forEach(i => {
      txt += `[ ] ${i.qty} x ${i.name.toUpperCase()}` + LF;
      if (i.note) {
        txt += `    >> NOTA: ${i.note}` + LF;
      }
    });
    txt += separator + LF;
    txt += LF + LF + LF;
    txt += '\x1Bm'; // Cut paper command
    return txt;
  }

  // Direct socket printing simulation
  static async sendToLocalThermalSinks(ipAddress: string, portAddress: number, bytesPayload: string): Promise<{ success: boolean; message: string }> {
    console.log(`[ThermalPrinter] Sending ESC/POS payload to raw Socket ${ipAddress}:${portAddress}...`);
    
    // Check if running in Electron environment for native transmission
    if ((window as any).electronAPI) {
      try {
        const res = await (window as any).electronAPI.printToHardware({ ipAddress, portAddress, bytesPayload });
        return { success: true, message: res.message };
      } catch (err) {
        return { success: false, message: 'Fallo al despachar directo a socket nativo mediante Electron.' };
      }
    }

    // Falls back to direct local printing visualization
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `Impresión emulada en socket ${ipAddress}:${portAddress} realizada exitosamente.`
        });
      }, 350);
    });
  }
}
