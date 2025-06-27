import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { translations } from '../lib/translations';

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
  },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 20,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row"
  },
  tableColHeader: {
    width: "50%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f2f2f2',
    padding: 5,
  },
  tableCol: {
    width: "50%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  tableCellHeader: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  tableCell: {
    fontSize: 10
  },
  chartContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  chartImage: {
    width: 500,
    height: 'auto',
  },
  profitabilityTable: {
    display: "table",
    width: "auto",
    marginTop: 20,
  },
  profitabilityTableRow: {
    margin: "auto",
    flexDirection: "row",
    backgroundColor: '#f2f2f2',
  },
  profitabilityTableRowAlt: {
    backgroundColor: '#ffffff',
  },
  profitabilityTableColHeader: {
    width: "33.33%",
    backgroundColor: '#34495e',
    padding: 8,
  },
  profitabilityTableCellHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profitabilityTableCol: {
    width: "33.33%",
    padding: 8,
  },
  profitabilityTableCell: {
    fontSize: 10
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

const Table = ({ title, data, lang }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.table}>
      {Object.entries(data).map(([key, value]) => (
        <View style={styles.tableRow} key={key}>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>{lang[key] || key}</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>{value || 'N/A'}</Text>
          </View>
        </View>
      ))}
    </View>
  </View>
);

const Presentation = ({ data, inputs, language = 'en' }) => {
    const t = translations[language];

    if (!data || !inputs) {
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
    paybackPeriod,
    graphData
  } = data;
  
  const { costData, rentalData, expensesData } = inputs;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.logo}>
            <Text>{t.logo}</Text>
        </View>
        <Text style={styles.header}>{t.title}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.investmentSummary}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>{t.totalInvestment}</Text>
            <Text style={styles.value}>{formatCurrency(totalInvestment)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t.paybackPeriod}</Text>
            <Text style={styles.value}>{paybackPeriod ? paybackPeriod.toFixed(1) : 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.annualFinancials}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>{t.grossRentalIncome}</Text>
            <Text style={styles.value}>{formatCurrency(annualRentalIncome)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t.operatingExpenses}</Text>
            <Text style={styles.value}>{formatCurrency(annualExpenses)}</Text>
          </View>
           <View style={styles.row}>
            <Text style={styles.label}>{t.noi}</Text>
            <Text style={styles.value}>{formatCurrency(annualNetProfit)}</Text>
          </View>
        </View>
        
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.kpis}</Text>
            <View style={styles.row}>
                <Text style={styles.label}>{t.roi}</Text>
                <Text style={styles.roiValue}>{formatPercentage(roi)}</Text>
            </View>
        </View>

        <Text style={styles.footer}>
          {t.footer}
        </Text>
      </Page>

      <Page size="A4" style={styles.page}>
         <Text style={styles.header}>{t.detailedInputsTitle}</Text>
         <Table title={t.investmentCosts} data={costData} lang={t} />
         <Table title={t.rentalIncomeData} data={rentalData} lang={t} />
         <Table title={t.annualExpenses} data={expensesData} lang={t} />
         <Text style={styles.footer}>
          {t.page2Footer}
        </Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{t.profitabilityTitle}</Text>
        <View style={styles.profitabilityTable}>
          <View style={styles.profitabilityTableRow} fixed>
            <View style={styles.profitabilityTableColHeader}>
              <Text style={styles.profitabilityTableCellHeader}>{t.year}</Text>
            </View>
            <View style={styles.profitabilityTableColHeader}>
              <Text style={styles.profitabilityTableCellHeader}>{t.annualNetProfit}</Text>
            </View>
            <View style={styles.profitabilityTableColHeader}>
              <Text style={styles.profitabilityTableCellHeader}>{t.accumulatedProfit}</Text>
            </View>
          </View>
          {graphData.map((row, index) => (
            <View style={[styles.profitabilityTableRow, index % 2 === 0 ? styles.profitabilityTableRowAlt : {}]} key={row.year} wrap={false}>
              <View style={styles.profitabilityTableCol}>
                <Text style={styles.profitabilityTableCell}>{row.year}</Text>
              </View>
              <View style={styles.profitabilityTableCol}>
                <Text style={styles.profitabilityTableCell}>{formatCurrency(row.profit)}</Text>
              </View>
              <View style={styles.profitabilityTableCol}>
                <Text style={styles.profitabilityTableCell}>{formatCurrency(row.accumulatedProfit)}</Text>
              </View>
            </View>
          ))}
        </View>
        <Text style={styles.footer}>
          {t.page3Footer}
        </Text>
      </Page>
    </Document>
  );
}

export default Presentation; 