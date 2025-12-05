import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
} from '@mui/material';
import { FileDownload } from '@mui/icons-material';
import { getApi } from '../../services/api/client';
import type { DiagnosisResponse } from '../../api/generated';

interface DiagnosisStats {
  diagnosis: DiagnosisResponse;
  patientCount: number;
  percentage: number;
}

const DiagnosisStatsPage: React.FC = () => {
  const [stats, setStats] = useState<DiagnosisStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [diagResp, patientResp] = await Promise.all([
        getApi().getDiagnosesApiV1DiagnosesGet(),
        getApi().getPatientsApiV1PatientsGet(),
      ]);

      const diagData = diagResp.data || [];
      const patientData = patientResp.data || [];

      const statsMap = new Map<number, number>();
      patientData.forEach((patient) => {
        if (patient.diagnosis_id) {
          statsMap.set(patient.diagnosis_id, (statsMap.get(patient.diagnosis_id) || 0) + 1);
        }
      });

      const total = patientData.length || 1;
      const calculatedStats: DiagnosisStats[] = diagData.map((diagnosis) => ({
        diagnosis,
        patientCount: statsMap.get(diagnosis.id!) || 0,
        percentage: Math.round(((statsMap.get(diagnosis.id!) || 0) / total) * 100),
      }));

      setStats(calculatedStats.sort((a, b) => b.patientCount - a.patientCount));
      setError('');
    } catch (err: any) {
      setError('Failed to load diagnosis statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    setError('');
    try {
      const response = await getApi().exportDiagnosisStatsReportPdfApiV1ReportsDiagnosisStatsPdfGet({
        responseType: 'blob'
      });

      if (response.status !== 200) {
        throw new Error('Failed to generate PDF report');
      }

      // Type assertion to tell TypeScript it's an ArrayBuffer
      const blob = new Blob([response.data as ArrayBuffer], { 
        type: 'application/pdf' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diagnoses_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || 'Failed to export PDF');
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const totalPatients = stats.reduce((sum, s) => sum + s.patientCount, 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Diagnosis Statistics</Typography>
        <Button
          variant="contained"
          startIcon={<FileDownload />}
          onClick={handleExportPDF}
          disabled={exporting || stats.length === 0}
        >
          {exporting ? 'Exporting...' : 'Export PDF'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Typography>Loading diagnosis data...</Typography>
        </Box>
      ) : (
        <>
          {/* Summary Card */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Total Patients: {totalPatients}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Across {stats.length} diagnoses
            </Typography>
          </Paper>

          {/* Statistics Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Diagnosis</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Patient Count
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Percentage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.map((stat) => (
                  <TableRow key={stat.diagnosis.id} hover>
                    <TableCell>{stat.diagnosis.name}</TableCell>
                    <TableCell align="right">{stat.patientCount}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={stat.percentage}
                          sx={{
                            flex: 1,
                            minWidth: 150,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#e0e0e0',
                          }}
                        />
                        <Typography variant="body2" sx={{ minWidth: 50 }}>
                          {stat.percentage}%
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {stats.length === 0 && (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">No diagnosis data available</Typography>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};

export default DiagnosisStatsPage;
