import { DBState, Product, Customer } from '../types';

export class BackupService {
  /**
   * Serializes the current active local database to a timestamped JSON file.
   */
  static exportDatabaseToJSON(state: DBState) {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
      const downloadAnchor = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `lual_gastro_backup_${timestamp}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      return true;
    } catch (e) {
      console.error('Failed to parse database state to download stream:', e);
      return false;
    }
  }

  /**
   * Validates structure of user-provided JSON files to shield against system corruption.
   */
  static validateBackupJSON(parsed: any): parsed is DBState {
    if (!parsed) return false;
    // Check key requirements of DBState
    const hasProducts = Array.isArray(parsed.products);
    const hasHistory = Array.isArray(parsed.history);
    const hasSettings = parsed.settings && typeof parsed.settings.isCashOpen === 'boolean';
    return !!(hasProducts && hasHistory && hasSettings);
  }

  /**
   * Allows bulk importing products from a structured CSV or text block.
   */
  static parseProductCsv(rawText: string): Partial<Product>[] {
    const lines = rawText.split('\n');
    const items: Partial<Product>[] = [];

    lines.forEach((line) => {
      const parts = line.split(',');
      if (parts.length >= 4) {
        const name = parts[0].trim();
        const cost = parseFloat(parts[1]) || 0;
        const price = parseFloat(parts[2]) || 0;
        const stock = parseFloat(parts[3]) || 0;
        const cat = parts[4] ? parts[4].trim() : 'COMIDA';
        const min = parts[5] ? parseInt(parts[5]) : 5;

        if (name) {
          items.push({
            id: Math.floor(Math.random() * 100000),
            name,
            cost,
            price,
            stock,
            min,
            cat
          });
        }
      }
    });

    return items;
  }
}
