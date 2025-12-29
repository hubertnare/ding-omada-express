import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { parseOmadaCSV, ParseResult, ParsedVoucher } from '@/lib/omada-parser';
import { cn } from '@/lib/utils';

interface CSVUploaderProps {
  onParsed: (result: ParseResult) => void;
  isProcessing?: boolean;
}

export function CSVUploader({ onParsed, isProcessing }: CSVUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    setParseResult(null);
    
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    if (uploadedFile.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit');
      return;
    }

    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const result = parseOmadaCSV(content);
        setParseResult(result);
        
        if (result.vouchers.length === 0) {
          setError('No valid vouchers found in the CSV file');
        }
      } catch (err) {
        setError('Failed to parse CSV file. Please check the format.');
      }
    };
    reader.readAsText(uploadedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    disabled: isProcessing,
  });

  const clearFile = () => {
    setFile(null);
    setParseResult(null);
    setError(null);
  };

  const handleConfirm = () => {
    if (parseResult) {
      onParsed(parseResult);
    }
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer",
          isDragActive && "border-admin-blue bg-admin-blue/5",
          !isDragActive && "border-border hover:border-admin-blue/50 hover:bg-muted/30",
          isProcessing && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-admin-blue/10 rounded-full flex items-center justify-center">
            <Upload className="h-8 w-8 text-admin-blue" />
          </div>
          <div>
            <p className="font-medium text-foreground">
              {isDragActive ? 'Drop the CSV file here' : 'Upload OMADA CSV Export'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Drag and drop or click to browse • Max 50MB
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* File Info & Preview */}
      {file && parseResult && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-admin-blue/10 rounded-lg">
                  <FileText className="h-5 w-5 text-admin-blue" />
                </div>
                <div>
                  <CardTitle className="text-base">{file.name}</CardTitle>
                  <CardDescription>
                    {(file.size / 1024).toFixed(1)} KB • {parseResult.stats.total} rows
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={clearFile} disabled={isProcessing}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-success/10 rounded-lg text-center">
                <p className="text-2xl font-bold text-success">{parseResult.stats.parsed}</p>
                <p className="text-xs text-muted-foreground">Valid Vouchers</p>
              </div>
              <div className="p-3 bg-destructive/10 rounded-lg text-center">
                <p className="text-2xl font-bold text-destructive">{parseResult.stats.failed}</p>
                <p className="text-xs text-muted-foreground">Failed Rows</p>
              </div>
              <div className="p-3 bg-admin-blue/10 rounded-lg text-center">
                <p className="text-2xl font-bold text-admin-blue">{parseResult.stats.locations.length}</p>
                <p className="text-xs text-muted-foreground">Locations</p>
              </div>
            </div>

            {/* Price Distribution */}
            {Object.keys(parseResult.stats.priceDistribution).length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Price Distribution</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(parseResult.stats.priceDistribution).map(([price, count]) => (
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
            {parseResult.stats.locations.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Locations</p>
                <div className="flex flex-wrap gap-2">
                  {parseResult.stats.locations.map((location) => (
                    <span
                      key={location}
                      className="inline-flex items-center px-2.5 py-1 bg-admin-blue/10 text-admin-blue rounded-full text-xs font-medium"
                    >
                      {location}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Errors Preview */}
            {parseResult.errors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-destructive mb-2">
                  Errors ({parseResult.errors.length})
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
                  {parseResult.errors.slice(0, 5).map((err, i) => (
                    <div key={i} className="p-2 bg-destructive/5 rounded text-destructive">
                      Row {err.row}: {err.error}
                    </div>
                  ))}
                  {parseResult.errors.length > 5 && (
                    <p className="text-muted-foreground">
                      ...and {parseResult.errors.length - 5} more errors
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Confirm Button */}
            <Button
              className="w-full bg-admin-blue hover:bg-admin-blue/90"
              onClick={handleConfirm}
              disabled={isProcessing || parseResult.vouchers.length === 0}
            >
              {isProcessing ? (
                'Processing...'
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Upload {parseResult.vouchers.length} Vouchers
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
