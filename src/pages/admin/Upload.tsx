import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { CSVUploader } from '@/components/admin/CSVUploader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ParseResult } from '@/lib/omada-parser';
import { toast } from 'sonner';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminUpload() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMapping, setStatusMapping] = useState({
    Expired: 'active' as const,
    Active: 'active' as const,
    Used: 'sold' as const,
  });
  const [autoActivate, setAutoActivate] = useState(true);

  const handleParsedCSV = async (result: ParseResult) => {
    if (result.vouchers.length === 0) {
      toast.error('No valid vouchers to upload');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Create batch record
      const batchId = `omada_batch_${Date.now()}`;
      const { data: batch, error: batchError } = await supabase
        .from('voucher_batches')
        .insert({
          batch_id: batchId,
          filename: 'omada_upload.csv',
          uploaded_by: user?.id,
          total_vouchers: result.vouchers.length,
          price_distribution: result.stats.priceDistribution,
          locations: result.stats.locations,
          status_mapping: statusMapping,
          auto_activate: autoActivate,
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Process vouchers in chunks
      const chunkSize = 100;
      const chunks = [];
      for (let i = 0; i < result.vouchers.length; i += chunkSize) {
        chunks.push(result.vouchers.slice(i, i + chunkSize));
      }

      let processed = 0;
      let failed = 0;
      const failures: Array<{ row: number; code: string; error: string }> = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        const vouchersToInsert = chunk.map((v) => ({
          voucher_code: v.voucherCode,
          original_code: v.originalCode,
          price_value: v.priceValue,
          price_currency: v.priceCurrency,
          price_display: v.priceDisplay,
          description: v.description,
          download_speed: v.downloadSpeed,
          upload_speed: v.uploadSpeed,
          speed_display: v.speedDisplay,
          duration_hours: v.durationHours,
          duration_display: v.durationDisplay,
          validity_type: v.validityType,
          status: autoActivate ? 'active' : 'reserved',
          location: v.location,
          uploaded_batch: batch.id,
          omada_data: v.omadaData,
        }));

        const { error: insertError } = await supabase
          .from('vouchers')
          .insert(vouchersToInsert);

        if (insertError) {
          // Handle duplicate codes or other errors
          if (insertError.code === '23505') {
            // Unique constraint violation - try inserting one by one
            for (const voucher of vouchersToInsert) {
              const { error: singleError } = await supabase
                .from('vouchers')
                .insert(voucher);
              
              if (singleError) {
                failed++;
                failures.push({
                  row: processed + failed,
                  code: voucher.voucher_code,
                  error: 'Duplicate voucher code',
                });
              } else {
                processed++;
              }
            }
          } else {
            failed += chunk.length;
            chunk.forEach((v, idx) => {
              failures.push({
                row: processed + idx,
                code: v.voucherCode,
                error: insertError.message,
              });
            });
          }
        } else {
          processed += chunk.length;
        }

        setProgress(((i + 1) / chunks.length) * 100);
      }

      // Update batch with results
      await supabase
        .from('voucher_batches')
        .update({
          processed,
          failed,
          failures: failures.length > 0 ? failures : null,
        })
        .eq('id', batch.id);

      // Log audit
      await supabase.from('admin_audit_log').insert({
        action: 'OMADA_CSV_UPLOAD',
        admin_id: user?.id,
        admin_email: user?.email,
        details: {
          batch_id: batchId,
          total: result.vouchers.length,
          processed,
          failed,
          status_mapping: statusMapping,
        },
      });

      if (failed > 0) {
        toast.warning(`Uploaded ${processed} vouchers with ${failed} failures`);
      } else {
        toast.success(`Successfully uploaded ${processed} vouchers`);
      }

      navigate('/admin/vouchers');
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.message || 'Failed to upload vouchers');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Upload OMADA CSV</h1>
          <p className="text-muted-foreground">
            Import vouchers from OMADA hotspot export files
          </p>
        </div>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload Configuration</CardTitle>
            <CardDescription>
              Configure how OMADA data is mapped to your voucher system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Mapping */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Status Mapping</Label>
              <p className="text-xs text-muted-foreground">
                Map OMADA "Type" column to your voucher status
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Expired →</Label>
                  <Select
                    value={statusMapping.Expired}
                    onValueChange={(v) =>
                      setStatusMapping({ ...statusMapping, Expired: v as any })
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Active →</Label>
                  <Select
                    value={statusMapping.Active}
                    onValueChange={(v) =>
                      setStatusMapping({ ...statusMapping, Active: v as any })
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Used →</Label>
                  <Select
                    value={statusMapping.Used}
                    onValueChange={(v) =>
                      setStatusMapping({ ...statusMapping, Used: v as any })
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Auto Activate */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-activate vouchers</Label>
                <p className="text-xs text-muted-foreground">
                  Activate all uploaded vouchers immediately
                </p>
              </div>
              <Switch checked={autoActivate} onCheckedChange={setAutoActivate} />
            </div>
          </CardContent>
        </Card>

        {/* Upload Progress */}
        {isProcessing && (
          <Card>
            <CardContent className="py-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uploading vouchers...</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* CSV Uploader */}
        <CSVUploader onParsed={handleParsedCSV} isProcessing={isProcessing} />

        {/* Help Text */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Expected CSV Format</p>
                <p>
                  Upload CSV files exported from OMADA with columns: Code, Created Time,
                  Download, Upload, Price, Notes, Duration, Site Name, etc.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
