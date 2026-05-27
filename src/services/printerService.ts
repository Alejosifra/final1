import { ThermalPrinterService, ThermalReceiptData } from './printService';

export class PrinterService {
  /**
   * Dispatches the ESC/POS payload via local network socket or QZ Tray loopback integration.
   */
  static async executePrintJob(receipt: ThermalReceiptData, ticketSize: '58mm' | '80mm' = '80mm', printerIp: string = '192.168.1.99', printerPort: number = 9100): Promise<{ status: 'success' | 'network_error'; errorDetails?: string }> {
    const rawESCPOS = ThermalPrinterService.generateRawESCPOS(receipt, ticketSize);

    try {
      console.log(`[Thermal ESC/POS PrintJob] Conveying raw stream payload to standard printer socket: tcp://${printerIp}:${printerPort}`);
      const res = await ThermalPrinterService.sendToLocalThermalSinks(printerIp, printerPort, rawESCPOS);
      if (res.success) {
        return { status: 'success' };
      } else {
        return { status: 'network_error', errorDetails: res.message };
      }
    } catch (e: any) {
      return { status: 'network_error', errorDetails: e?.message };
    }
  }

  static generatePrintableInvoiceID(tableName: string): string {
    const randomHex = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();
    const tableAbbreviation = tableName.replace(/\s+/g, '').substring(0, 4).toUpperCase();
    return `FAC-${tableAbbreviation}-${randomHex}`;
  }
}
