import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
  ],
});


const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 11,
    padding: 30,
    flexDirection: 'column',
    backgroundColor: '#FFFFFF'
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  section: {
    marginBottom: 15,
    padding: 15,
    border: '1px solid #eaeaea',
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#34495e',
    borderBottom: '2px solid #3498db',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  value: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  roiValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 9,
    color: 'grey',
  },
  logo: {
      marginBottom: 20,
      textAlign: 'center',
      fontSize: 16,
      fontWeight: 'bold',
      color: '#3498db',
  }
});

const formatCurrency = (value) => {
    if (typeof value !== 'number') return 'N/A';
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatPercentage = (value) => {
    if (typeof value !== 'number') return 'N/A';
    return `${value.toFixed(2)}%`;
}

const Presentation = ({ data }) => {
    if (!data) {
        return (
            <Document>
                <Page style={styles.page}>
                    <View>
                        <Text>No data available to generate a presentation.</Text>
                    </View>
                </Page>
            </Document>
        );
    }
  
  const { 
    totalInvestment,
    annualRentalIncome,
    annualExpenses,
    annualNetProfit,
    roi,
    paybackPeriod
  } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.logo}>
            <Text>My Admin Panel</Text>
        </View>
        <Text style={styles.header}>Investor ROI Presentation</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investment Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Investment</Text>
            <Text style={styles.value}>{formatCurrency(totalInvestment)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payback Period (Years)</Text>
            <Text style={styles.value}>{paybackPeriod ? paybackPeriod.toFixed(1) : 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Annual Financials</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Gross Rental Income</Text>
            <Text style={styles.value}>{formatCurrency(annualRentalIncome)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Operating Expenses</Text>
            <Text style={styles.value}>{formatCurrency(annualExpenses)}</Text>
          </View>
           <View style={styles.row}>
            <Text style={styles.label}>Net Operating Income (NOI)</Text>
            <Text style={styles.value}>{formatCurrency(annualNetProfit)}</Text>
          </View>
        </View>
        
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Performance Indicators (KPIs)</Text>
            <View style={styles.row}>
                <Text style={styles.label}>Return on Investment (ROI)</Text>
                <Text style={styles.roiValue}>{formatPercentage(roi)}</Text>
            </View>
        </View>

        <Text style={styles.footer}>
          This document is computer-generated and contains confidential information.
        </Text>
      </Page>
    </Document>
  );
}

export default Presentation; 