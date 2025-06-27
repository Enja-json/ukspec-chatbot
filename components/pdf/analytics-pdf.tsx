import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { CompetencyAnalytics } from '@/lib/types';
import { competencyColors, competencyLabels } from '@/lib/constants';
import { Chart } from 'react-chartjs-2';

// Register custom fonts
Font.register({
  family: 'Inter',
  src: '/fonts/Inter-Regular.ttf',
});

Font.register({
  family: 'Inter-Bold',
  src: '/fonts/Inter-Bold.ttf',
});

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  logo: {
    width: 120,
    height: 'auto',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Inter',
  },
  date: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Inter',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 15,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  metricCard: {
    width: '30%',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  metricValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Inter',
  },
  chartContainer: {
    marginBottom: 30,
    height: 300,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  categoryCard: {
    width: '18%',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#666666',
    fontSize: 10,
    fontFamily: 'Inter',
  },
});

interface AnalyticsPDFProps {
  analytics: CompetencyAnalytics;
  userName: string;
}

export function AnalyticsPDF({ analytics, userName }: AnalyticsPDFProps) {
  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const totalCompetencyEntries = analytics.categoryDistribution.reduce(
    (sum, item) => sum + item.count, 
    0
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image 
              src="/images/logoweb.png"
              style={styles.logo}
            />
            <Text style={styles.title}>Competency Analytics Report</Text>
            <Text style={styles.subtitle}>{userName}&apos;s Engineering Development Progress</Text>
            <Text style={styles.date}>Generated on {today}</Text>
          </View>
        </View>

        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: competencyColors.B }]}>
                {analytics.totalTasks}
              </Text>
              <Text style={styles.metricLabel}>Total Tasks</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: competencyColors.C }]}>
                {totalCompetencyEntries}
              </Text>
              <Text style={styles.metricLabel}>Competency Entries</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: competencyColors.E }]}>
                {analytics.totalEvidence}
              </Text>
              <Text style={styles.metricLabel}>Evidence Files</Text>
            </View>
          </View>
        </View>

        {/* Category Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Distribution</Text>
          <View style={styles.categoryGrid}>
            {analytics.categoryDistribution.map((category) => {
              const percentage = totalCompetencyEntries > 0 
                ? Math.round((category.count / totalCompetencyEntries) * 100) 
                : 0;
              
              return (
                <View 
                  key={category.category}
                  style={[
                    styles.categoryCard,
                    { borderLeftColor: competencyColors[category.category as keyof typeof competencyColors] }
                  ]}
                >
                  <Text style={styles.metricValue}>{category.count}</Text>
                  <Text style={styles.metricLabel}>
                    Category {category.category}
                  </Text>
                  <Text style={styles.metricLabel}>
                    {competencyLabels[category.category as keyof typeof competencyLabels]}
                  </Text>
                  <Text style={styles.metricLabel}>
                    {percentage}% of total
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Top Competencies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Most Demonstrated Competencies</Text>
          <View>
            {analytics.topCompetencies.slice(0, 5).map((comp) => (
              <View 
                key={comp.competencyCodeId}
                style={{
                  flexDirection: 'row',
                  marginBottom: 10,
                  padding: 10,
                  backgroundColor: '#f8f9fa',
                  borderRadius: 4,
                }}
              >
                <Text style={{ flex: 1, fontFamily: 'Inter-Bold' }}>
                  {comp.competencyCodeId}
                </Text>
                <Text style={{ flex: 4, fontFamily: 'Inter' }}>
                  {comp.title}
                </Text>
                <Text style={{ flex: 1, textAlign: 'right', fontFamily: 'Inter-Bold' }}>
                  {comp.count} entries
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Generated by Mini Mentor • {today} • Confidential
        </Text>
      </Page>
    </Document>
  );
} 