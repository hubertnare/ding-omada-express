import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw, Eye, FileText, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Batch {
  id: string;
  batch_id: string;
  filename: string;
  uploaded_at: string;
  total_vouchers: number;
  processed: number;
  failed: number;
  price_distribution: Record<string, number> | null;
  locations: string[] | null;
  failures: Array<{ row: number; code: string; error: string }> | null;
}

export default function AdminBatches() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('voucher_batches')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      setBatches((data as unknown as Batch[]) || []);
    } catch (err: any) {
      console.error('Error fetching batches:', err);
      toast.error('Failed to load batch history');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Batch History</h1>
            <p className="text-muted-foreground">View all CSV upload batches</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchBatches}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Batch ID</TableHead>
                  <TableHead>Filename</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Processed</TableHead>
                  <TableHead className="text-center">Failed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Loading batches...
                    </TableCell>
                  </TableRow>
                ) : batches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No batches found. Upload your first CSV!
                    </TableCell>
                  </TableRow>
                ) : (
                  batches.map((batch) => (
                    <TableRow key={batch.id} className="group">
                      <TableCell className="font-mono text-xs">{batch.batch_id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{batch.filename}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(batch.uploaded_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {batch.total_vouchers}
                      </TableCell>
                      <TableCell className="text-center text-success font-medium">
                        {batch.processed}
                      </TableCell>
                      <TableCell className="text-center text-destructive font-medium">
                        {batch.failed}
                      </TableCell>
                      <TableCell>
                        {batch.failed === 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-success">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Complete
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-warning">
                            <XCircle className="h-3.5 w-3.5" />
                            Partial
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setSelectedBatch(batch)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={!!selectedBatch} onOpenChange={() => setSelectedBatch(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Batch Details</DialogTitle>
              <DialogDescription>
                {selectedBatch?.batch_id}
              </DialogDescription>
            </DialogHeader>
            {selectedBatch && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{selectedBatch.total_vouchers}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="p-3 bg-success/10 rounded-lg text-center">
                    <p className="text-2xl font-bold text-success">{selectedBatch.processed}</p>
                    <p className="text-xs text-muted-foreground">Processed</p>
                  </div>
                  <div className="p-3 bg-destructive/10 rounded-lg text-center">
                    <p className="text-2xl font-bold text-destructive">{selectedBatch.failed}</p>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </div>
                </div>

                {/* Price Distribution */}
                {selectedBatch.price_distribution && Object.keys(selectedBatch.price_distribution).length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Price Distribution</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedBatch.price_distribution).map(([price, count]) => (
                        <span
                          key={price}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted rounded-full text-xs"
                        >
                          <span className="font-medium">{price}</span>
                          <span className="text-muted-foreground">× {count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Locations */}
                {selectedBatch.locations && selectedBatch.locations.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Locations</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedBatch.locations.map((loc) => (
                        <span
                          key={loc}
                          className="inline-flex items-center px-2.5 py-1 bg-admin-blue/10 text-admin-blue rounded-full text-xs font-medium"
                        >
                          {loc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Failures */}
                {selectedBatch.failures && selectedBatch.failures.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-destructive mb-2">
                      Failures ({selectedBatch.failures.length})
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-1 text-xs">
                      {selectedBatch.failures.map((err, i) => (
                        <div key={i} className="p-2 bg-destructive/5 rounded text-destructive">
                          Row {err.row}: {err.error} {err.code && `(${err.code})`}
                        </div>
                      ))}
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
