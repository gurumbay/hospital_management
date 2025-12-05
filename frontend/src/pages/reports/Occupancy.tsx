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
import { distributionService } from '../../services/distributionService';
import type { WardResponse } from '../../api/generated';

const OccupancyReportPage: React.FC = () => {
  const [wards, setWards] = useState<WardResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchWards();
  }, []);

  const fetchWards = async () => {
    setLoading(true);
    try {
      const response = await getApi().getWardsApiV1WardsGet();
      setWards((response.data || []).sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      setError('');
    } catch (err: any) {
      setError('Failed to load ward occupancy data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    setError('');
    try {
      const response = await getApi().exportOccupancyReportPdfApiV1ReportsOccupancyPdfGet();

      if (response.status !== 200) {
        throw new Error('Failed to generate PDF report');
      }

      // Type assertion to tell TypeScript it's an ArrayBuffer
      const arrayBuffer = response.data as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { 
        type: 'application/pdf' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `occupancy_report_${new Date().toISOString().split('T')[0]}.pdf`;
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

  const totalCapacity = wards.reduce((sum, w) => sum + w.max_capacity, 0);
  const totalOccupancy = wards.reduce((sum, w) => sum + (w.current_occupancy || 0), 0);
  const totalPercent = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Ward Occupancy Report</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<FileDownload />}
            onClick={handleExportPDF}
            disabled={exporting || wards.length === 0}
          >
            {exporting ? 'Exporting...' : 'Export PDF'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Typography>Loading ward data...</Typography>
        </Box>
      ) : (
        <>
          {/* Summary Card */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Hospital Occupancy Summary
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={totalPercent}
                  sx={{
                    height: 24,
                    borderRadius: 2,
                    backgroundColor: '#e0e0e0',
                  }}
                />
              </Box>
              <Typography variant="h6" sx={{ minWidth: 80 }}>
                {totalPercent}%
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mt: 2 }}>
              {totalOccupancy} / {totalCapacity} beds occupied
            </Typography>
          </Paper>

          {/* Ward Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ward Name</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Max Capacity
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Current Occupancy
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Free Beds
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Occupancy Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {wards.map((ward) => {
                  const occupancyPercent = distributionService.getOccupancyPercent(ward);
                  const freeBeds = distributionService.getFreeBeds(ward);
                  const color = distributionService.getOccupancyStatusColor(ward);

                  return (
                    <TableRow key={ward.id} hover>
                      <TableCell>{ward.name}</TableCell>
                      <TableCell align="right">{ward.max_capacity}</TableCell>
                      <TableCell align="right">{ward.current_occupancy || 0}</TableCell>
                      <TableCell align="right">{freeBeds}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={occupancyPercent}
                            sx={{
                              flex: 1,
                              minWidth: 120,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: '#e0e0e0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: color,
                              },
                            }}
                          />
                          <Typography variant="body2" sx={{ minWidth: 50 }}>
                            {occupancyPercent}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default OccupancyReportPage;
