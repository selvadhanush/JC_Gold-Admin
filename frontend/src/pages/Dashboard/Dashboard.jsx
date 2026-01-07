import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Download,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import DashboardService from '../../services/dashboardService';
import { toast } from 'react-toastify';
import './Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await DashboardService.getStats();
        setStats(data.data);
      } catch (err) {
        toast.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleExport = async () => {
    try {
      await DashboardService.exportSalesCSV();
      toast.success('Report downloaded successfully');
    } catch (err) {
      toast.error(err);
    }
  };

  const chartData = {
    labels: stats?.dailySales?.map(d => d._id) || [],
    datasets: [
      {
        label: 'Daily Sales (₹)',
        data: stats?.dailySales?.map(d => d.sales) || [],
        fill: true,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderColor: '#d4af37',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#d4af37',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#141417',
        titleColor: '#94a3b8',
        bodyColor: '#d4af37',
        borderColor: '#2d2d35',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 10 } }
      }
    }
  };

  if (loading) return <div className="loading-spinner">Crunching data...</div>;

  return (
    <div className="dashboard-page">
      <div className="page-header-flex">
        <div className="page-header">
          <h1>Dashboard Overview</h1>
          <p>Real-time performance metrics for your jewellery store.</p>
        </div>
        <button className="gold-btn export-btn" onClick={handleExport}>
          <Download size={18} />
          <span>Export Sales</span>
        </button>
      </div>

      <div className="stats-grid">
        <StatCard 
          title="Total Revenue" 
          value={`₹${stats?.totalRevenue?.toLocaleString()}`} 
          icon={<DollarSign size={24} />} 
          trend="+12.5%" 
          isPositive={true} 
        />
        <StatCard 
          title="Product Sales" 
          value={stats?.dailySales?.reduce((acc, curr) => acc + curr.count, 0) || 0} 
          icon={<ShoppingBag size={24} />} 
          trend="+5.2%" 
          isPositive={true} 
        />
        <StatCard 
          title="Scheme Income" 
          value={`₹${stats?.schemeRevenue?.toLocaleString()}`} 
          icon={<TrendingUp size={24} />} 
          trend="-2.1%" 
          isPositive={false} 
        />
        <StatCard 
          title="Total Orders" 
          value={stats?.ordersByStatus?.reduce((acc, curr) => acc + curr.count, 0) || 0} 
          icon={<Users size={24} />} 
          trend="+8.0%" 
          isPositive={true} 
        />
      </div>

      <div className="dashboard-content-grid">
        <div className="chart-container glass">
          <div className="chart-header">
            <h3>Revenue Trends (Last 30 Days)</h3>
          </div>
          <div className="chart-wrapper">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="top-products-card glass">
          <div className="card-header">
            <h3>Top Selling Products</h3>
          </div>
          <div className="product-list-mini">
            {stats?.topProducts?.map((item, index) => (
              <div key={index} className="mini-product-item">
                <div className="product-rank">{index + 1}</div>
                <div className="product-details">
                  <span className="product-name">{item.productDetails.name}</span>
                  <span className="product-sku">{item.productDetails.sku}</span>
                </div>
                <div className="product-sales">
                  <span className="sales-val">{item.totalSold} sold</span>
                  <span className="revenue-val">₹{item.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, isPositive }) => (
  <div className="stat-card glass">
    <div className="stat-icon-wrapper">{icon}</div>
    <div className="stat-info">
      <span className="stat-title">{title}</span>
      <h2 className="stat-value">{value}</h2>
      <div className={`stat-trend ${isPositive ? 'positive' : 'negative'}`}>
        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        <span>{trend} vs last month</span>
      </div>
    </div>
  </div>
);

export default Dashboard;
