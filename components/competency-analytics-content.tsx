'use client';

import { useEffect, useState } from 'react';
import type { Session } from 'next-auth';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { getUserEntitlements } from '@/lib/ai/entitlements';
import { usePaywall } from '@/components/paywall-provider';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface CompetencyAnalytics {
  totalTasks: number;
  totalEvidence: number;
  categoryDistribution: Array<{
    category: string;
    count: number;
    averageConfidence: number;
  }>;
  competencyCodeDistribution: Array<{
    competencyCodeId: string;
    category: string;
    title: string;
    count: number;
    averageConfidence: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    taskCount: number;
  }>;
  sourceDistribution: Array<{
    source: string;
    count: number;
  }>;
  topCompetencies: Array<{
    competencyCodeId: string;
    category: string;
    title: string;
    count: number;
  }>;
}

const competencyColors = {
  A: '#ef4444', // Red-500 for Knowledge and Understanding
  B: '#3b82f6', // Blue-500 for Design and Development
  C: '#22c55e', // Green-500 for Responsibility and Management
  D: '#f97316', // Orange-500 for Communication and Interpersonal Skills
  E: '#a855f7', // Purple-500 for Professional Commitment
};

const competencyBackgroundColors = {
  A: 'rgba(239, 68, 68, 0.1)', // Red bg
  B: 'rgba(59, 130, 246, 0.1)', // Blue bg
  C: 'rgba(34, 197, 94, 0.1)', // Green bg
  D: 'rgba(249, 115, 22, 0.1)', // Orange bg
  E: 'rgba(168, 85, 247, 0.1)', // Purple bg
};

const competencyLabels = {
  A: 'Knowledge & Understanding',
  B: 'Design & Development',
  C: 'Responsibility & Management',
  D: 'Communication & Interpersonal',
  E: 'Professional Commitment',
};

export function CompetencyAnalyticsContent({ session }: { session: Session }) {
  const [analytics, setAnalytics] = useState<CompetencyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [userSubscriptionStatus, setUserSubscriptionStatus] = useState<string>('none');
  const { showPaywall } = usePaywall();

  // Get user entitlements
  const userType = session.user?.type || 'regular';
  const userEntitlements = getUserEntitlements(userType, userSubscriptionStatus as any);
  const canExport = userEntitlements.canExportAnalyticsPDF;

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch('/api/competency/analytics');
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    async function fetchUserDetails() {
      try {
        const response = await fetch('/api/user/details');
        if (response.ok) {
          const userData = await response.json();
          setUserSubscriptionStatus(userData.subscriptionStatus || 'none');
        }
      } catch (err) {
        console.error('Failed to fetch user details:', err);
      }
    }

    fetchAnalytics();
    fetchUserDetails();
  }, []);

  const handleExport = async () => {
    if (!canExport) {
      // Show paywall modal for non-professional users
      showPaywall('signup');
      return;
    }

    try {
      setExporting(true);
      const response = await fetch('/api/competency/analytics/export');
      if (!response.ok) {
        throw new Error('Failed to export analytics');
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      
      // Get the filename from the Content-Disposition header or use a default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/["']/g, '')
        : 'competency-analytics.pdf';
      
      link.setAttribute('download', filename);
      
      // Append to body, click, and cleanup
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting analytics:', err);
      toast.error('Failed to export analytics');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col w-full">
        <header className="flex items-center gap-3 p-4 border-b">
          <SidebarToggle />
          <h1 className="text-xl font-semibold">Competency Analytics</h1>
        </header>
        <div className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-12 w-20" />
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-64 w-full" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex flex-col w-full">
        <header className="flex items-center gap-3 p-4 border-b">
          <SidebarToggle />
          <h1 className="text-xl font-semibold">Competency Analytics</h1>
        </header>
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Unable to Load Analytics</h2>
            <p className="text-muted-foreground">
              {error || 'Failed to load your competency analytics. Please try again later.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const categoryChartData = {
    labels: analytics.categoryDistribution.map(item => `Category ${item.category}`),
    datasets: [
      {
        label: 'Competency Entries',
        data: analytics.categoryDistribution.map(item => item.count),
        backgroundColor: analytics.categoryDistribution.map(item => competencyColors[item.category as keyof typeof competencyColors]),
        borderColor: analytics.categoryDistribution.map(item => competencyColors[item.category as keyof typeof competencyColors]),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const doughnutData = {
    labels: analytics.categoryDistribution.map(item => `Category ${item.category}`),
    datasets: [
      {
        data: analytics.categoryDistribution.map(item => item.count),
        backgroundColor: analytics.categoryDistribution.map(item => competencyColors[item.category as keyof typeof competencyColors]),
        borderWidth: 0,
        hoverBorderWidth: 2,
      },
    ],
  };

  const trendData = {
    labels: analytics.monthlyTrends.map(item => {
      const date = new Date(item.month + '-01');
      return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    }),
    datasets: [
      {
        label: 'Tasks Created',
        data: analytics.monthlyTrends.map(item => item.taskCount),
        borderColor: competencyColors.B,
        backgroundColor: competencyBackgroundColors.B,
        tension: 0.4,
        pointBackgroundColor: competencyColors.B,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: true,
      },
    ],
  };

  const topCompetenciesData = {
    labels: analytics.topCompetencies.slice(0, 8).map(item => item.competencyCodeId),
    datasets: [
      {
        label: 'Frequency',
        data: analytics.topCompetencies.slice(0, 8).map(item => item.count),
        backgroundColor: analytics.topCompetencies.slice(0, 8).map(item => competencyColors[item.category as keyof typeof competencyColors]),
        borderColor: analytics.topCompetencies.slice(0, 8).map(item => competencyColors[item.category as keyof typeof competencyColors]),
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12,
          },
          usePointStyle: true,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function(context: any) {
            const categoryIndex = context.dataIndex;
            const category = analytics.categoryDistribution[categoryIndex].category;
            return [
              `${context.formattedValue} entries`,
              competencyLabels[category as keyof typeof competencyLabels]
            ];
          }
        }
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const,
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            size: 12,
          },
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function(context: any) {
            const categoryIndex = context.dataIndex;
            const category = analytics.categoryDistribution[categoryIndex].category;
            return [
              `${context.formattedValue} entries`,
              competencyLabels[category as keyof typeof competencyLabels]
            ];
          }
        }
      },
    },
    animation: {
      animateRotate: true,
      duration: 1000,
    },
    cutout: '60%',
  };

  const lineOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        beginAtZero: true,
      },
    },
  };

  const totalCompetencyEntries = analytics.categoryDistribution.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="flex flex-col w-full">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <SidebarToggle />
          <div>
            <h1 className="text-xl font-semibold">Competency Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Analyse your engineering competency distribution and chartership progress
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2"
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export PDF
            </>
          )}
        </Button>
      </header>

      <div className="flex-1 p-6 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border-l-4" style={{ borderLeftColor: competencyColors.B }}>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Tasks</h3>
            <p className="text-3xl font-bold" style={{ color: competencyColors.B }}>{analytics.totalTasks}</p>
            <p className="text-xs text-muted-foreground mt-1">Engineering tasks logged</p>
          </Card>

          <Card className="p-6 border-l-4" style={{ borderLeftColor: competencyColors.C }}>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Competency Entries</h3>
            <p className="text-3xl font-bold" style={{ color: competencyColors.C }}>{totalCompetencyEntries}</p>
            <p className="text-xs text-muted-foreground mt-1">UK-SPEC competencies demonstrated</p>
          </Card>

          <Card className="p-6 border-l-4" style={{ borderLeftColor: competencyColors.E }}>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Evidence Files</h3>
            <p className="text-3xl font-bold" style={{ color: competencyColors.E }}>{analytics.totalEvidence}</p>
            <p className="text-xs text-muted-foreground mt-1">Supporting evidence uploaded</p>
          </Card>
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Distribution Bar Chart */}
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Competency Category Distribution</h3>
              <p className="text-sm text-muted-foreground">
                This chart shows how your demonstrated competencies are distributed across the five UK-SPEC categories. 
                A balanced distribution indicates well-rounded professional development across all key engineering areas.
              </p>
            </div>
            <div className="h-80">
              <Bar data={categoryChartData} options={chartOptions} />
            </div>
          </Card>

          {/* Competency Distribution Doughnut */}
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Competency Portfolio Overview</h3>
              <p className="text-sm text-muted-foreground">
                This doughnut chart provides a visual overview of your competency portfolio balance. Each colour represents 
                a different UK-SPEC category, helping you quickly identify areas of strength and potential development needs.
              </p>
            </div>
            <div className="h-80">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </Card>

          {/* Activity Trends */}
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Activity Trends (12 Months)</h3>
              <p className="text-sm text-muted-foreground">
                Track your competency logging activity over time. Consistent task recording demonstrates ongoing 
                professional development and preparation for your chartership application.
              </p>
            </div>
            <div className="h-80">
              <Line data={trendData} options={lineOptions} />
            </div>
          </Card>

          {/* Top Competencies */}
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Most Demonstrated Competencies</h3>
              <p className="text-sm text-muted-foreground">
                Your most frequently demonstrated individual competencies. This highlights your areas of expertise 
                and can help identify which competencies might benefit from additional evidence.
              </p>
            </div>
            <div className="h-80">
              <Bar data={topCompetenciesData} options={chartOptions} />
            </div>
          </Card>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 gap-8">
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Category Breakdown & Analysis</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Detailed analysis of your competency distribution with recommendations for chartership preparation.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {analytics.categoryDistribution.map((category) => {
                const percentage = totalCompetencyEntries > 0 ? Math.round((category.count / totalCompetencyEntries) * 100) : 0;
                const isUnderrepresented = percentage < 15;
                const isWellRepresented = percentage >= 20;
                
                return (
                  <div key={category.category} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: competencyColors[category.category as keyof typeof competencyColors] }}
                      />
                      <span className="font-medium text-sm">
                        Category {category.category}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {competencyLabels[category.category as keyof typeof competencyLabels]}
                      </p>
                      <p className="text-2xl font-bold">
                        {category.count}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {percentage}% of total
                      </p>
                    </div>
                    
                    {category.averageConfidence && (
                      <div>
                        <p className="text-xs text-muted-foreground">Avg. Confidence</p>
                        <p className="text-sm font-medium">{category.averageConfidence}%</p>
                      </div>
                    )}
                    
                    <div className="text-xs">
                      {isUnderrepresented && (
                        <span className="bg-red-100 text-red-800 border-red-200 px-2 py-1 rounded-md">
                          Needs attention
                        </span>
                      )}
                      {isWellRepresented && (
                        <span className="bg-green-100 text-green-800 border-green-200 px-2 py-1 rounded-md">
                          Well developed
                        </span>
                      )}
                      {!isUnderrepresented && !isWellRepresented && (
                        <span className="bg-blue-100 text-blue-800 border-blue-200 px-2 py-1 rounded-md">
                          Developing
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 