import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Ticket, DollarSign, MapPin, TrendingUp, Upload, ArrowRight } from 'lucide-react';

interface DashboardStats {
  totalVouchers: number;
  availableVouchers: number;
  soldVouchers: number;
  revenue: number;
  locationDistribution: Record<string, number>;
  priceDistribution: Record<string, number>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalVouchers: 0,
    availableVouchers: 0,
    soldVouchers: 0,
    revenue: 0,
    locationDistribution: {},
    priceDistribution: {},
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch all vouchers for stats
      const { data: vouchers, error } = await supabase
        .from('vouchers')
        .select('status, price_value, price_display, location, is_sold');

      if (error) throw error;

      const locationDist: Record<string, number> = {};
      const priceDist: Record<string, number> = {};
      let revenue = 0;
      let available = 0;
      let sold = 0;

      vouchers?.forEach((v) => {
        // Location distribution
        if (v.location) {
          locationDist[v.location] = (locationDist[v.location] || 0) + 1;
        }

        // Price distribution
        if (v.price_display) {
          priceDist[v.price_display] = (priceDist[v.price_display] || 0) + 1;
        }

        // Status counts
        if (v.status === 'active' && !v.is_sold) {
          available++;
        }
        if (v.is_sold) {
          sold++;
          revenue += v.price_value || 0;
        }
      });

      setStats({
        totalVouchers: vouchers?.length || 0,
        availableVouchers: available,
        soldVouchers: sold,
        revenue,
        locationDistribution: locationDist,
        priceDistribution: priceDist,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
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
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">OMADA Voucher Management Overview</p>
          </div>
          <Link to="/admin/upload">
            <Button className="bg-admin-blue hover:bg-admin-blue/90">
              <Upload className="h-4 w-4 mr-2" />
              Upload CSV
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Vouchers"
            value={stats.totalVouchers.toLocaleString()}
            icon={<Ticket className="h-5 w-5" />}
          />
          <StatCard
            title="Available"
            value={stats.availableVouchers.toLocaleString()}
            subtitle="Ready for sale"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatCard
            title="Sold"
            value={stats.soldVouchers.toLocaleString()}
            icon={<Ticket className="h-5 w-5" />}
          />
          <StatCard
            title="Revenue"
            value={`$${stats.revenue.toLocaleString()}`}
            subtitle="Total sales"
            icon={<DollarSign className="h-5 w-5" />}
          />
        </div>

        {/* Distribution Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Location */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">By Location</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {Object.keys(stats.locationDistribution).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No location data available
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(stats.locationDistribution)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([location, count]) => (
                      <div key={location} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{location}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-admin-blue rounded-full"
                              style={{
                                width: `${(count / stats.totalVouchers) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* By Price Point */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">By Price Point</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {Object.keys(stats.priceDistribution).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No price data available
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(stats.priceDistribution)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([price, count]) => (
                      <div key={price} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{price}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-success rounded-full"
                              style={{
                                width: `${(count / stats.totalVouchers) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/admin/upload">
                <Button variant="outline" className="w-full justify-between h-auto py-4">
                  <div className="flex items-center gap-3">
                    <Upload className="h-5 w-5 text-admin-blue" />
                    <div className="text-left">
                      <p className="font-medium">Upload Vouchers</p>
                      <p className="text-xs text-muted-foreground">Import OMADA CSV</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Link>
              <Link to="/admin/vouchers">
                <Button variant="outline" className="w-full justify-between h-auto py-4">
                  <div className="flex items-center gap-3">
                    <Ticket className="h-5 w-5 text-admin-blue" />
                    <div className="text-left">
                      <p className="font-medium">Manage Vouchers</p>
                      <p className="text-xs text-muted-foreground">View all vouchers</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Link>
              <Link to="/admin/batches">
                <Button variant="outline" className="w-full justify-between h-auto py-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-admin-blue" />
                    <div className="text-left">
                      <p className="font-medium">Batch History</p>
                      <p className="text-xs text-muted-foreground">View upload history</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
