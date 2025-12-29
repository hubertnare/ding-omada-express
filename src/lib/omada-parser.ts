// OMADA CSV Parser and Transformer

export interface OmadaRow {
  Code: string;
  'Created Time': string;
  Download: string;
  Upload: string;
  'Traffic Limit Type': string;
  'Traffic Limit': string;
  'Used Data': string;
  'Remaining Data': string;
  Price: string;
  Notes: string;
  Duration: string;
  'Duration Type': string;
  'Validity Type': string;
  Type: string;
  Portals: string;
  'Portal Logout': string;
  'Site Name': string;
  'Print Comments': string;
  'Voucher Group Name': string;
}

export interface ParsedVoucher {
  voucherCode: string;
  originalCode: string;
  priceValue: number;
  priceCurrency: string;
  priceDisplay: string;
  description: string | null;
  downloadSpeed: number | null;
  uploadSpeed: number | null;
  speedDisplay: string | null;
  durationHours: number | null;
  durationDisplay: string | null;
  validityType: 'Permanent' | 'Temporary';
  status: 'active' | 'sold' | 'expired' | 'reserved';
  location: string | null;
  omadaData: OmadaRow;
}

export interface ParseResult {
  success: boolean;
  vouchers: ParsedVoucher[];
  errors: Array<{ row: number; code: string; error: string }>;
  stats: {
    total: number;
    parsed: number;
    failed: number;
    priceDistribution: Record<string, number>;
    locations: string[];
  };
}

// Parse OMADA Price format: "USD10" → { value: 10, currency: "USD" }
export function parsePrice(omadaPrice: string): { value: number; currency: string } | null {
  if (!omadaPrice || typeof omadaPrice !== 'string') return null;
  
  const cleaned = omadaPrice.trim();
  const currency = cleaned.replace(/[0-9.]/g, '');
  const valueStr = cleaned.replace(/[^0-9.]/g, '');
  const value = parseFloat(valueStr);
  
  if (isNaN(value) || !currency) return null;
  
  return { value, currency };
}

// Parse Duration: "720.0Hours" → 720
export function parseDuration(durationString: string): number | null {
  if (!durationString || typeof durationString !== 'string') return null;
  
  const cleaned = durationString.replace(/Hours?/i, '').trim();
  const value = parseFloat(cleaned);
  
  return isNaN(value) ? null : value;
}

// Parse Speed: "30.0Mbps" → 30
export function parseSpeed(speedString: string): number | null {
  if (!speedString || typeof speedString !== 'string') return null;
  
  const cleaned = speedString.replace(/Mbps?/i, '').trim();
  const value = parseFloat(cleaned);
  
  return isNaN(value) ? null : value;
}

// Parse Date: "Mar 30 2025 03:37:01 PM" → ISO Date
export function parseOmadaDate(dateString: string): Date | null {
  if (!dateString || typeof dateString !== 'string') return null;
  
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

// Map OMADA status to our status
export function mapStatus(
  omadaType: string,
  mapping: Record<string, 'active' | 'sold' | 'expired' | 'reserved'>
): 'active' | 'sold' | 'expired' | 'reserved' {
  const normalizedType = omadaType?.trim() || '';
  return mapping[normalizedType] || 'active';
}

// Parse a single OMADA row
export function parseOmadaRow(
  row: OmadaRow,
  statusMapping: Record<string, 'active' | 'sold' | 'expired' | 'reserved'>
): { voucher: ParsedVoucher | null; error: string | null } {
  // Validate required fields
  if (!row.Code || row.Code.trim() === '') {
    return { voucher: null, error: 'Missing voucher code' };
  }

  const price = parsePrice(row.Price);
  if (!price) {
    return { voucher: null, error: `Invalid price format: "${row.Price}"` };
  }

  const downloadSpeed = parseSpeed(row.Download);
  const uploadSpeed = parseSpeed(row.Upload);
  const durationHours = parseDuration(row.Duration);

  const voucher: ParsedVoucher = {
    voucherCode: row.Code.trim(),
    originalCode: row.Code.trim(),
    priceValue: price.value,
    priceCurrency: price.currency,
    priceDisplay: row.Price.trim(),
    description: row.Notes?.trim() || null,
    downloadSpeed,
    uploadSpeed,
    speedDisplay: downloadSpeed && uploadSpeed ? `${downloadSpeed}/${uploadSpeed} Mbps` : null,
    durationHours,
    durationDisplay: durationHours 
      ? `${durationHours} Hours (${Math.floor(durationHours / 24)} days)`
      : null,
    validityType: row['Validity Type']?.toLowerCase().includes('permanent') ? 'Permanent' : 'Temporary',
    status: mapStatus(row.Type, statusMapping),
    location: row['Site Name']?.trim() || null,
    omadaData: row,
  };

  return { voucher, error: null };
}

// Parse CSV content
export function parseCSV(content: string): OmadaRow[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);

  // Parse data rows
  const rows: OmadaRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });
    rows.push(row as unknown as OmadaRow);
  }

  return rows;
}

// Parse a single CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

// Main parse function
export function parseOmadaCSV(
  content: string,
  statusMapping: Record<string, 'active' | 'sold' | 'expired' | 'reserved'> = {
    'Expired': 'active',
    'Active': 'active',
    'Used': 'sold',
  }
): ParseResult {
  const rows = parseCSV(content);
  const vouchers: ParsedVoucher[] = [];
  const errors: Array<{ row: number; code: string; error: string }> = [];
  const priceDistribution: Record<string, number> = {};
  const locationSet = new Set<string>();

  rows.forEach((row, index) => {
    const { voucher, error } = parseOmadaRow(row, statusMapping);
    
    if (error) {
      errors.push({ row: index + 2, code: row.Code || '', error });
    } else if (voucher) {
      vouchers.push(voucher);
      
      // Track stats
      const priceKey = voucher.priceDisplay;
      priceDistribution[priceKey] = (priceDistribution[priceKey] || 0) + 1;
      
      if (voucher.location) {
        locationSet.add(voucher.location);
      }
    }
  });

  return {
    success: errors.length === 0,
    vouchers,
    errors,
    stats: {
      total: rows.length,
      parsed: vouchers.length,
      failed: errors.length,
      priceDistribution,
      locations: Array.from(locationSet),
    },
  };
}
