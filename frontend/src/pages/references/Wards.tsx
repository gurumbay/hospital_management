import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  LinearProgress,
} from '@mui/material';
import { CustomDataGrid } from '../../components/ui/CustomDataGrid';
import { getApi } from '../../services/api/client';
import { extractErrorMessage } from '../../utils/errorHandling';
import { distributionService } from '../../services/distributionService';
import type { WardResponse, WardCreate, DiagnosisResponse } from '../../api/generated';

type Column = {
  field: string;
  headerName: string;
  width?: number | string;
  renderCell?: (value: any, row: any) => React.ReactNode;
};

const WardsPage: React.FC = () => {
  const [wards, setWards] = useState<WardResponse[]>([]);
  const [diagnoses, setDiagnoses] = useState<DiagnosisResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWard, setSelectedWard] = useState<WardResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<WardCreate>({
    name: '',
    max_capacity: 4,
    diagnosis_id: undefined,
  });

  useEffect(() => {
    fetchWards();
    fetchDiagnoses();
  }, []);

  const fetchWards = async () => {
    setLoading(true);
    try {
      const response = await getApi().getWardsApiV1WardsGet();
      setWards(response.data || []);
      setError('');
    } catch (err: any) {
      setError(extractErrorMessage(err) || 'Failed to load wards');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiagnoses = async () => {
    try {
      const response = await getApi().getDiagnosesApiV1DiagnosesGet();
      setDiagnoses(response.data || []);
    } catch (err) {
      console.error('Failed to load diagnoses:', err);
    }
  };

  const handleOpenModal = (ward?: WardResponse) => {
    if (ward) {
      setSelectedWard(ward);
      setFormData({
        name: ward.name,
        max_capacity: ward.max_capacity,
        diagnosis_id: ward.diagnosis_id,
      });
      setIsEditing(false);
    } else {
      setSelectedWard(null);
      setFormData({
        name: '',
        max_capacity: 4,
        diagnosis_id: undefined,
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedWard(null);
    setIsEditing(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'max_capacity' || name === 'diagnosis_id' 
        ? parseInt(value) || undefined 
        : value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (selectedWard) {
        await getApi().updateWardApiV1WardsWardIdPut(selectedWard.id, formData);
      } else {
        await getApi().createWardApiV1WardsPost(formData);
      }
      fetchWards();
      handleCloseModal();
    } catch (err: any) {
      setError(extractErrorMessage(err) || 'Failed to save ward');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedWard || !window.confirm('Are you sure?')) return;

    setLoading(true);
    try {
      await getApi().deleteWardApiV1WardsWardIdDelete(selectedWard.id);
      fetchWards();
      handleCloseModal();
    } catch (err: any) {
      setError(extractErrorMessage(err) || 'Failed to delete ward');
    } finally {
      setLoading(false);
    }
  };

  const getDiagnosisName = (diagnosisId?: number | null): string => {
    if (!diagnosisId) return 'Not assigned';
    const diagnosis = diagnoses.find((d) => d.id === diagnosisId);
    return diagnosis?.name || 'Unknown';
  };

  const columns: Column[] = [
    { field: 'id', headerName: 'ID', width: 50 },
    { field: 'name', headerName: 'Ward Name', width: 150 },
    { field: 'max_capacity', headerName: 'Capacity', width: 100 },
    { field: 'current_occupancy', headerName: 'Occupied', width: 100 },
    {
      field: 'occupancy_percent',
      headerName: 'Usage %',
      width: 150,
      renderCell: (_value, row) => {
        const percent = distributionService.getOccupancyPercent(row);
        return (
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinearProgress
              variant="determinate"
              value={percent}
              sx={{
                flex: 1,
                height: 20,
                borderRadius: 2,
              }}
            />
            <Typography variant="body2">{percent}%</Typography>
          </Box>
        );
      },
    },
    {
      field: 'diagnosis_id',
      headerName: 'Diagnosis',
      width: 150,
      renderCell: (value) => getDiagnosisName(value),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Wards</Typography>
        <Button variant="contained" onClick={() => handleOpenModal()}>
          Add Ward
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <CustomDataGrid
        data={wards}
        columns={columns}
        onRowClick={(ward) => handleOpenModal(ward)}
        loading={loading}
      />

      {/* CRUD Modal */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedWard ? 'View Ward' : 'Add New Ward'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Ward Name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              disabled={!!(selectedWard && !isEditing)}
              required
            />
            <TextField
              fullWidth
              type="number"
              label="Max Capacity"
              name="max_capacity"
              value={formData.max_capacity}
              onChange={handleFormChange}
              disabled={!!(selectedWard && !isEditing)}
              required
              inputProps={{ min: 1, max: 100 }}
            />
            <TextField
              fullWidth
              select
              label="Diagnosis"
              name="diagnosis_id"
              value={formData.diagnosis_id || ''}
              onChange={handleFormChange}
              disabled={!!(selectedWard && !isEditing)}
              SelectProps={{
                native: true,
              }}
              InputLabelProps={{ shrink: true }}
            >
              <option value="">Not assigned</option>
              {diagnoses.map((diag) => (
                <option key={diag.id} value={diag.id}>
                  {diag.name}
                </option>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          {selectedWard && !isEditing ? (
            <>
              <Button onClick={() => setIsEditing(true)}>Edit</Button>
              <Button onClick={handleDelete} color="error">
                Delete
              </Button>
              <Button onClick={handleCloseModal}>Close</Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleSave}
                variant="contained"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
              <Button onClick={handleCloseModal} disabled={loading}>
                Cancel
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WardsPage;
