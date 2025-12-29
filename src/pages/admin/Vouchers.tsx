import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { VoucherTable, VoucherRow } from '@/components/admin/VoucherTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Download, Filter, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState<VoucherRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherRow | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    fetchVouchers();
  }, [statusFilter, locationFilter]);

  const fetchVouchers = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('vouchers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'active' | 'sold' | 'expired' | 'reserved');
      }

      if (locationFilter !== 'all') {
        query = query.eq('location', locationFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setVouchers(data || []);

      // Get unique locations
      const { data: locData } = await supabase
        .from('vouchers')
        .select('location')
        .not('location', 'is', null);

      const uniqueLocations = [...new Set(locData?.map((l) => l.location).filter(Boolean))] as string[];
      setLocations(uniqueLocations);
    } catch (err: any) {
      console.error('Error fetching vouchers:', err);
      toast.error('Failed to load vouchers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (voucher: VoucherRow) => {
    setSelectedVoucher(voucher);
  };

  const handleDeactivate = async (voucher: VoucherRow) => {
    try {
      const { error } = await supabase
        .from('vouchers')
        .update({ status: 'expired' })
        .eq('id', voucher.id);

      if (error) throw error;

      toast.success('Voucher deactivated');
      fetchVouchers();
    } catch (err: any) {
      toast.error('Failed to deactivate voucher');
    }
  };

  const handleDelete = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} voucher(s)? This cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase.from('vouchers').delete().in('id', ids);

      if (error) throw error;

      toast.success(`Deleted ${ids.length} voucher(s)`);
      fetchVouchers();
    } catch (err: any) {
      toast.error('Failed to delete vouchers');
    }
  };

  const handleBulkAction = async (action: string, ids: string[]) => {
    try {
      if (action === 'activate') {
        const { error } = await supabase
          .from('vouchers')
          .update({ status: 'active' })
          .in('id', ids);

        if (error) throw error;

        toast.success(`Activated ${ids.length} voucher(s)`);
        fetchVouchers();
      }
    } catch (err: any) {
      toast.error('Failed to perform action');
    }
  };

  const exportCSV = () => {
    const headers = ['Code', 'Price', 'Description', 'Speed', 'Duration', 'Validity', 'Location', 'Status', 'Sold To', 'Sold At'];
    const rows = vouchers.map((v) => [
      v.voucher_code,
      v.price_display,
      v.description || '',
      v.speed_display || (v.download_speed && v.upload_speed ? `${v.download_speed}/${v.upload_speed} Mbps` : ''),
      v.duration_display || (v.duration_hours ? `${Math.floor(v.duration_hours / 24)} days` : ''),
      v.validity_type || '',
      v.location || '',
      v.status || '',
      v.sold_to || '',
      v.sold_at || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vouchers_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Vouchers</h1>
            <p className="text-muted-foreground">Manage all OMADA vouchers</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchVouchers}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Link to="/admin/upload">
              <Button size="sm" className="bg-admin-blue hover:bg-admin-blue/90">
                Upload CSV
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] bg-background">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-[150px] bg-background">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <VoucherTable
          vouchers={vouchers}
          isLoading={isLoading}
          onViewDetails={handleViewDetails}
          onDeactivate={handleDeactivate}
          onDelete={handleDelete}
          onBulkAction={handleBulkAction}
        />

        {/* Detail Dialog */}
        <Dialog open={!!selectedVoucher} onOpenChange={() => setSelectedVoucher(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Voucher Details</DialogTitle>
              <DialogDescription>
                Code: {selectedVoucher?.voucher_code}
              </DialogDescription>
            </DialogHeader>
            {selectedVoucher && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Price</p>
                    <p className="font-medium">{selectedVoucher.price_display}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{selectedVoucher.status}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Speed</p>
                    <p className="font-medium">
                      {selectedVoucher.speed_display || 
                        (selectedVoucher.download_speed && selectedVoucher.upload_speed 
                          ? `${selectedVoucher.download_speed}/${selectedVoucher.upload_speed} Mbps` 
                          : '-')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-medium">
                      {selectedVoucher.duration_display || 
                        (selectedVoucher.duration_hours 
                          ? `${selectedVoucher.duration_hours} hours (${Math.floor(selectedVoucher.duration_hours / 24)} days)` 
                          : '-')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Validity Type</p>
                    <p className="font-medium">{selectedVoucher.validity_type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-medium">{selectedVoucher.location || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {selectedVoucher.created_at 
                        ? new Date(selectedVoucher.created_at).toLocaleDateString() 
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Currency</p>
                    <p className="font-medium">{selectedVoucher.price_currency}</p>
                  </div>
                </div>
                {selectedVoucher.description && (
                  <div>
                    <p className="text-muted-foreground text-sm">Description</p>
                    <p className="font-medium">{selectedVoucher.description}</p>
                  </div>
                )}
                {selectedVoucher.is_sold && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Sale Information</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Sold To</p>
                        <p className="font-medium">{selectedVoucher.sold_to || '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Sold At</p>
                        <p className="font-medium">
                          {selectedVoucher.sold_at
                            ? new Date(selectedVoucher.sold_at).toLocaleString()
                            : '-'}
                        </p>
                      </div>
                      {selectedVoucher.ecocash_ref && (
                        <div>
                          <p className="text-muted-foreground">EcoCash Ref</p>
                          <p className="font-medium">{selectedVoucher.ecocash_ref}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">SMS Delivered</p>
                        <p className="font-medium">{selectedVoucher.sms_delivered ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
