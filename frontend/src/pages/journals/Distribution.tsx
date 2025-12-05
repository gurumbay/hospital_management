import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import { CustomDataGrid } from '../../components/ui/CustomDataGrid';
import { getApi } from '../../services/api/client';
import { distributionService } from '../../services/distributionService';
import type { PatientResponse, WardResponse } from '../../api/generated';

type Column = {
  field: string;
  headerName: string;
  width?: number | string;
  renderCell?: (value: any, row: any) => React.ReactNode;
};

const DistributionPage: React.FC = () => {
  const [unassignedPatients, setUnassignedPatients] = useState<PatientResponse[]>([]);
  const [wards, setWards] = useState<WardResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [distributing, setDistributing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all patients and filter unassigned
      const patientsResp = await getApi().getPatientsApiV1PatientsGet();
      const allPatients = patientsResp.data || [];
      const unassigned = allPatients.filter((p) => !p.ward_id || p.ward_id === null);
      setUnassignedPatients(unassigned);

      // Fetch all wards
      const wardsResp = await getApi().getWardsApiV1WardsGet();
      setWards(wardsResp.data || []);

      setError('');
    } catch (err: any) {
      setError('Failed to load distribution data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignWard = async (wardId: number) => {
    if (!selectedPatient) return;

    setLoading(true);
    try {
      await getApi().updatePatientApiV1PatientsPatientIdPut(selectedPatient.id, {
        ward_id: wardId,
      });
      // Update local UI: remove patient from unassigned list and increment ward occupancy
      setUnassignedPatients((prev) => prev.filter((p) => p.id !== selectedPatient.id));
      setWards((prev) =>
        prev.map((w) =>
          w.id === wardId ? { ...w, current_occupancy: (w.current_occupancy || 0) + 1 } : w
        )
      );

      setModalOpen(false);
      setSelectedPatient(null);

      // Refresh from server to ensure consistency
      fetchData();
    } catch (err: any) {
      setError('Failed to assign ward');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDistribute = async () => {
    if (!window.confirm('Auto-assign all unassigned patients?')) return;

    setDistributing(true);
    try {
      // Iterate over a shallow copy because we'll be modifying state inside the loop
      const patientsToAssign = [...unassignedPatients];
      for (const patient of patientsToAssign) {
        const suggestedWard = distributionService.suggestWard(patient, wards);
        if (suggestedWard) {
          try {
            await getApi().updatePatientApiV1PatientsPatientIdPut(patient.id, {
              ward_id: suggestedWard.id,
            });

            // Update UI immediately for responsiveness
            setUnassignedPatients((prev) => prev.filter((p) => p.id !== patient.id));
            setWards((prev) =>
              prev.map((w) =>
                w.id === suggestedWard.id ? { ...w, current_occupancy: (w.current_occupancy || 0) + 1 } : w
              )
            );
          } catch (err) {
            // Continue assigning others even if one fails
            console.error('Failed to assign patient', patient.id, err);
          }
        }
      }

      // Final sync
      fetchData();
    } catch (err: any) {
      setError('Auto-distribution encountered an error');
    } finally {
      setDistributing(false);
    }
  };

  const patientColumns: Column[] = [
    { field: 'id', headerName: 'ID', width: 50 },
    { field: 'first_name', headerName: 'First Name', width: 120 },
    { field: 'last_name', headerName: 'Last Name', width: 120 },
    { field: 'diagnosis_id', headerName: 'Diagnosis', width: 120 },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Patient Distribution</Typography>
        <Button
          variant="contained"
          onClick={handleAutoDistribute}
          disabled={unassignedPatients.length === 0 || distributing}
        >
          {distributing ? 'Distributing...' : 'Auto Distribute'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Unassigned Patients */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Unassigned Patients ({unassignedPatients.length})
        </Typography>
        <CustomDataGrid
          data={unassignedPatients}
          columns={patientColumns}
          onRowClick={(patient) => {
            setSelectedPatient(patient);
            setModalOpen(true);
          }}
          loading={loading}
        />
      </Box>

      {/* Ward Occupancy Overview */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Wards
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
          {wards.map((ward) => {
            const occupancyPercent = distributionService.getOccupancyPercent(ward);
            const color = distributionService.getOccupancyStatusColor(ward);

            return (
              <Card key={ward.id}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    {ward.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {ward.current_occupancy || 0} / {ward.max_capacity} beds
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={occupancyPercent}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: color,
                      },
                    }}
                  />
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    {occupancyPercent}% full
                  </Typography>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Box>

      {/* Ward Assignment Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Ward</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedPatient && (
            <>
              <Typography variant="body2" sx={{ mb: 3 }}>
                Assign <strong>{selectedPatient.first_name} {selectedPatient.last_name}</strong> to a ward:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {wards.map((ward) => (
                  <Button
                    key={ward.id}
                    variant="outlined"
                    onClick={() => handleAssignWard(ward.id!)}
                    disabled={loading}
                    fullWidth
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    {ward.name} ({ward.current_occupancy || 0}/{ward.max_capacity})
                  </Button>
                ))}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)} disabled={loading}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DistributionPage;
