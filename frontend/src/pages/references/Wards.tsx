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
import type { Column } from '../../components/ui/CustomDataGrid';
import { getApi } from '../../services/api/client';
import { extractErrorMessage } from '../../utils/errorHandling';
import { distributionService } from '../../services/distributionService';
import type { WardResponse, WardCreate } from '../../api/generated';

const WardsPage: React.FC = () => {
  const [wards, setWards] = useState<WardResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWard, setSelectedWard] = useState<WardResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<WardCreate>({
    name: '',
    max_capacity: 4,
  });

  useEffect(() => {
    fetchWards();
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


  const handleOpenModal = (ward?: WardResponse) => {
    if (ward) {
      setSelectedWard(ward);
      setFormData({
        name: ward.name,
        max_capacity: ward.max_capacity,
      });
      setIsEditing(false);
    } else {
      setSelectedWard(null);
      setFormData({
        name: '',
        max_capacity: 4,
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
      [name]: name === 'max_capacity'
        ? parseInt(value) || undefined
        : value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
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
    setError('');
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


  const columns: Column[] = [
    { field: 'id', headerName: 'ID', width: 50, sortable: true },
    { field: 'name', headerName: 'Ward Name', width: 150, sortable: true },
    { field: 'max_capacity', headerName: 'Capacity', width: 100, sortable: true },
    { field: 'current_occupancy', headerName: 'Occupied', width: 100, sortable: true },
    {
      field: 'occupancy_percent',
      headerName: 'Usage %',
      width: 150,
      sortable: false,
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
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
