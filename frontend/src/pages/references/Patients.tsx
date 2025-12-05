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
import type { PatientResponse, PatientCreate, DiagnosisResponse, WardResponse } from '../../api/generated';
import type { Column } from '../../components/ui/CustomDataGrid';

const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [diagnoses, setDiagnoses] = useState<DiagnosisResponse[]>([]);
  const [wards, setWards] = useState<WardResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<PatientCreate>>({
    first_name: '',
    last_name: '',
    father_name: '',
    diagnosis_id: 0,
    ward_id: undefined,
  });

  // Load data on component mount
  useEffect(() => {
    fetchPatients();
    fetchDiagnoses();
    fetchWards();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const resp = await getApi().getPatientsApiV1PatientsGet();
      setPatients(resp.data || []);
      setError('');
    } catch (err: any) {
      setError('Failed to load patients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiagnoses = async () => {
    try {
      const resp = await getApi().getDiagnosesApiV1DiagnosesGet();
      setDiagnoses(resp.data || []);
    } catch (err) {
      console.error('Failed to load diagnoses:', err);
    }
  };

  const fetchWards = async () => {
    try {
      const resp = await getApi().getWardsApiV1WardsGet();
      setWards(resp.data || []);
    } catch (err) {
      console.error('Failed to load wards:', err);
    }
  };

  const handleOpenModal = (patient?: PatientResponse) => {
    if (patient) {
      setSelectedPatient(patient);
      setFormData({
        first_name: patient.first_name,
        last_name: patient.last_name,
        father_name: patient.father_name,
        diagnosis_id: patient.diagnosis_id,
        ward_id: patient.ward_id,
      });
      setIsEditing(false);
    } else {
      setSelectedPatient(null);
      setFormData({
        first_name: '',
        last_name: '',
        father_name: '',
        diagnosis_id: 0,
        ward_id: undefined,
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPatient(null);
    setIsEditing(false);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | any>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'diagnosis_id' || name === 'ward_id' 
        ? (value === '' ? null : parseInt(value) || null)
        : value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (selectedPatient) {
        // Update existing patient - only send fields that were modified
        const updateData: any = {};
        
        // Only include fields in update if they differ from original
        if (formData.first_name !== selectedPatient.first_name) updateData.first_name = formData.first_name;
        if (formData.last_name !== selectedPatient.last_name) updateData.last_name = formData.last_name;
        if (formData.father_name !== selectedPatient.father_name) updateData.father_name = formData.father_name;
        if (formData.diagnosis_id !== selectedPatient.diagnosis_id) updateData.diagnosis_id = formData.diagnosis_id;
        if (formData.ward_id !== selectedPatient.ward_id) updateData.ward_id = formData.ward_id;
        
        await getApi().updatePatientApiV1PatientsPatientIdPut(selectedPatient.id, updateData);
      } else {
        // Create new patient
        await getApi().createPatientApiV1PatientsPost(formData as PatientCreate);
      }
      fetchPatients();
      handleCloseModal();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save patient');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPatient || !window.confirm('Are you sure?')) return;

    setLoading(true);
    try {
      await getApi().deletePatientApiV1PatientsPatientIdDelete(selectedPatient.id);
      fetchPatients();
      handleCloseModal();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete patient');
    } finally {
      setLoading(false);
    }
  };

  const getDiagnosisName = (diagnosisId: number): string => {
    const diagnosis = diagnoses.find((d) => d.id === diagnosisId);
    return diagnosis?.name || 'Unknown';
  };

  const getWardName = (wardId?: number | null): string => {
    if (!wardId) return 'Not assigned';
    const ward = wards.find((w) => w.id === wardId);
    return ward?.name || 'Unknown';
  };

  const columns: Column[] = [
    { field: 'id', headerName: 'ID', width: 50, sortable: true },
    { field: 'last_name', headerName: 'Last Name', width: 120, sortable: true },
    { field: 'first_name', headerName: 'First Name', width: 120, sortable: true },
    { field: 'father_name', headerName: 'Father Name', width: 120, sortable: true },
    {
      field: 'diagnosis_id',
      headerName: 'Diagnosis',
      width: 150,
      sortable: false,
      renderCell: (value) => getDiagnosisName(value),
    },
    {
      field: 'ward_id',
      headerName: 'Ward',
      width: 150,
      sortable: false,
      renderCell: (value) => getWardName(value),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Patients</Typography>
        <Button variant="contained" onClick={() => handleOpenModal()}>
          Add Patient
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <CustomDataGrid
        data={patients}
        columns={columns}
        onRowClick={(patient) => handleOpenModal(patient)}
        loading={loading}
      />

      {/* CRUD Modal */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedPatient ? 'View Patient' : 'Add New Patient'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="First Name"
              name="first_name"
              value={formData.first_name || ''}
              onChange={handleFormChange}
              disabled={!!(selectedPatient && !isEditing)}
              required
            />
            <TextField
              fullWidth
              label="Last Name"
              name="last_name"
              value={formData.last_name || ''}
              onChange={handleFormChange}
              disabled={!!(selectedPatient && !isEditing)}
              required
            />
            <TextField
              fullWidth
              label="Father Name"
              name="father_name"
              value={formData.father_name || ''}
              onChange={handleFormChange}
              disabled={!!(selectedPatient && !isEditing)}
            />
            <TextField
              fullWidth
              select
              label="Diagnosis"
              name="diagnosis_id"
              value={formData.diagnosis_id || ''}
              onChange={handleFormChange}
              disabled={!!(selectedPatient && !isEditing)}
              SelectProps={{
                native: true,
              }}
              InputLabelProps={{ shrink: true }}
            >
              <option value="">Select diagnosis</option>
              {diagnoses.map((diag) => (
                <option key={diag.id} value={diag.id}>
                  {diag.name}
                </option>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="Ward"
              name="ward_id"
              value={formData.ward_id || ''}
              onChange={handleFormChange}
              disabled={!!(selectedPatient && !isEditing)}
              SelectProps={{
                native: true,
              }}
              InputLabelProps={{ shrink: true }}
            >
              <option value="">Not assigned</option>
              {wards.map((ward) => (
                <option key={ward.id} value={ward.id}>
                  {ward.name}
                </option>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          {selectedPatient && !isEditing ? (
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

export default PatientsPage;
