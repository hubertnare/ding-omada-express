import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, MoreHorizontal, Eye, Send, Power, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VoucherRow {
  id: string;
  voucher_code: string;
  original_code: string;
  price_display: string;
  price_value: number;
  price_currency: string;
  description: string | null;
  speed_display: string | null;
  download_speed: number | null;
  upload_speed: number | null;
  duration_hours: number | null;
  duration_days: number | null;
  duration_display: string | null;
  validity_type: 'Permanent' | 'Temporary' | null;
  location: string | null;
  status: 'active' | 'sold' | 'expired' | 'reserved' | null;
  is_sold: boolean | null;
  sold_to: string | null;
  sold_at: string | null;
  ecocash_ref: string | null;
  sms_delivered: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  uploaded_batch: string | null;
}

interface VoucherTableProps {
  vouchers: VoucherRow[];
  isLoading?: boolean;
  onViewDetails?: (voucher: VoucherRow) => void;
  onResend?: (voucher: VoucherRow) => void;
  onDeactivate?: (voucher: VoucherRow) => void;
  onDelete?: (ids: string[]) => void;
  onBulkAction?: (action: string, ids: string[]) => void;
}

const statusConfig = {
  active: { label: 'Active', className: 'admin-badge-active' },
  sold: { label: 'Sold', className: 'admin-badge-sold' },
  expired: { label: 'Expired', className: 'admin-badge-expired' },
  reserved: { label: 'Reserved', className: 'admin-badge-reserved' },
};

export function VoucherTable({
  vouchers,
  isLoading,
  onViewDetails,
  onResend,
  onDeactivate,
  onDelete,
  onBulkAction,
}: VoucherTableProps) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredVouchers = vouchers.filter((v) => {
    const searchLower = search.toLowerCase();
    return (
      v.voucher_code.toLowerCase().includes(searchLower) ||
      v.description?.toLowerCase().includes(searchLower) ||
      v.location?.toLowerCase().includes(searchLower) ||
      v.price_display.toLowerCase().includes(searchLower)
    );
  });

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredVouchers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredVouchers.map((v) => v.id)));
    }
  };

  const handleBulkDelete = () => {
    if (onDelete && selectedIds.size > 0) {
      onDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Bulk Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by code, description, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction?.('activate', Array.from(selectedIds))}
            >
              <Power className="h-4 w-4 mr-1" />
              Activate
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.size === filteredVouchers.length && filteredVouchers.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead className="hidden lg:table-cell">Speed</TableHead>
              <TableHead className="hidden lg:table-cell">Duration</TableHead>
              <TableHead className="hidden xl:table-cell">Validity</TableHead>
              <TableHead className="hidden md:table-cell">Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  Loading vouchers...
                </TableCell>
              </TableRow>
            ) : filteredVouchers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No vouchers found
                </TableCell>
              </TableRow>
            ) : (
              filteredVouchers.map((voucher) => {
                const status = voucher.status || 'active';
                return (
                  <TableRow key={voucher.id} className="group">
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(voucher.id)}
                        onCheckedChange={() => toggleSelect(voucher.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm font-medium">
                      {voucher.voucher_code}
                    </TableCell>
                    <TableCell className="font-semibold text-admin-blue">
                      {voucher.price_display}
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] truncate text-muted-foreground">
                      {voucher.description || '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {voucher.speed_display || (voucher.download_speed && voucher.upload_speed 
                        ? `${voucher.download_speed}/${voucher.upload_speed} Mbps` 
                        : '-')}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {voucher.duration_display || (voucher.duration_hours 
                        ? `${Math.floor(voucher.duration_hours / 24)} days`
                        : '-')}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {voucher.validity_type && (
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-xs',
                          voucher.validity_type === 'Permanent' 
                            ? 'bg-success/10 text-success' 
                            : 'bg-warning/10 text-warning'
                        )}>
                          {voucher.validity_type}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {voucher.location && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-muted rounded text-xs">
                          {voucher.location}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={cn('admin-badge', statusConfig[status].className)}>
                        {statusConfig[status].label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          <DropdownMenuItem onClick={() => onViewDetails?.(voucher)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {voucher.is_sold && (
                            <DropdownMenuItem onClick={() => onResend?.(voucher)}>
                              <Send className="h-4 w-4 mr-2" />
                              Resend SMS
                            </DropdownMenuItem>
                          )}
                          {status === 'active' && (
                            <DropdownMenuItem onClick={() => onDeactivate?.(voucher)}>
                              <Power className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination info */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredVouchers.length} of {vouchers.length} vouchers
      </div>
    </div>
  );
}
