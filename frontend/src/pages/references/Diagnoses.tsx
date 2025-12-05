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
} from '@mui/material';
import { CustomDataGrid } from '../../components/ui/CustomDataGrid';
import { getApi } from '../../services/api/client';
import { extractErrorMessage } from '../../utils/errorHandling';
import { useNotification } from '../../contexts/NotificationContext';
import type { DiagnosisResponse, DiagnosisCreate } from '../../api/generated';

type Column = {
  field: string;
  headerName: string;
  width?: number | string;
};

const DiagnosesPage: React.FC = () => {
  const [diagnoses, setDiagnoses] = useState<DiagnosisResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<DiagnosisResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<DiagnosisCreate>({ name: '' });
  const { notify } = useNotification();

  useEffect(() => {
    fetchDiagnoses();
  }, []);

  const fetchDiagnoses = async () => {
    setLoading(true);
    try {
      const response = await getApi().getDiagnosesApiV1DiagnosesGet();
      setDiagnoses(response.data || []);
      setError('');
    } catch (err: any) {
      setError('Failed to load diagnoses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (diagnosis?: DiagnosisResponse) => {
    if (diagnosis) {
      setSelectedDiagnosis(diagnosis);
      setFormData({ name: diagnosis.name });
      setIsEditing(false);
    } else {
      setSelectedDiagnosis(null);
      setFormData({ name: '' });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedDiagnosis(null);
    setIsEditing(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (selectedDiagnosis) {
        await getApi().updateDiagnosisApiV1DiagnosesDiagnosisIdPut(selectedDiagnosis.id, formData);
      } else {
        await getApi().createDiagnosisApiV1DiagnosesPost(formData);
      }
      fetchDiagnoses();
      handleCloseModal();
    } catch (err: any) {
      setError(extractErrorMessage(err) || 'Failed to save diagnosis');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDiagnosis || !window.confirm('Are you sure?')) return;

    setLoading(true);
    try {
      // Check whether any patients reference this diagnosis
      const resp = await getApi().getPatientsApiV1PatientsGet({ diagnosis_id: selectedDiagnosis.id, limit: 1 });
      if (resp.data && resp.data.length > 0) {
        // Notify user and do not attempt deletion
        notify('Cannot delete diagnosis: it is assigned to one or more patients', 'error');
        setLoading(false);
        return;
      }

      await getApi().deleteDiagnosisApiV1DiagnosesDiagnosisIdDelete(selectedDiagnosis.id);
      fetchDiagnoses();
      handleCloseModal();
    } catch (err: any) {
      setError(extractErrorMessage(err) || 'Failed to delete diagnosis');
    } finally {
      setLoading(false);
    }
  };

  const columns: Column[] = [
    { field: 'id', headerName: 'ID', width: 50 },
    { field: 'name', headerName: 'Diagnosis Name', width: 300 },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Diagnoses</Typography>
        <Button variant="contained" onClick={() => handleOpenModal()}>
          Add Diagnosis
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <CustomDataGrid
        data={diagnoses}
        columns={columns}
        onRowClick={(diagnosis) => handleOpenModal(diagnosis)}
        loading={loading}
      />

      {/* CRUD Modal */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedDiagnosis ? 'View Diagnosis' : 'Add New Diagnosis'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Diagnosis Name"
            name="name"
            value={formData.name}
            onChange={handleFormChange}
            disabled={!!(selectedDiagnosis && !isEditing)}
            required
          />
        </DialogContent>
        <DialogActions>
          {selectedDiagnosis && !isEditing ? (
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

export default DiagnosesPage;
