import { useState, useCallback } from 'react';
import { getApi } from '../services/api/client';
import { extractErrorMessage } from '../utils/errorHandling';
import type {
  PatientResponse,
  PatientCreate,
  PatientUpdate,
  GetPatientsApiV1PatientsGetParams,
} from '../api/generated';

export const usePatients = () => {
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all patients with optional parameters
  const fetchPatients = useCallback(async (params?: GetPatientsApiV1PatientsGetParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getApi().getPatientsApiV1PatientsGet(params);
      setPatients(response.data || []);
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err) || 'Failed to load patients';
      setError(errorMsg);
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  }, [])

  // Fetch single patient by ID
  const fetchPatient = useCallback(async (id: number): Promise<PatientResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await getApi().getPatientApiV1PatientsPatientIdGet(id);
      return response.data || null;
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err) || 'Failed to load patient';
      setError(errorMsg);
      console.error('Error fetching patient:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new patient
  const createPatient = useCallback(async (data: PatientCreate): Promise<PatientResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await getApi().createPatientApiV1PatientsPost(data);
      const newPatient = response.data;
      setPatients((prev) => [newPatient, ...prev]);
      return newPatient;
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err) || 'Failed to create patient';
      setError(errorMsg);
      console.error('Error creating patient:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update existing patient
  const updatePatient = useCallback(
    async (id: number, data: PatientUpdate): Promise<PatientResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await getApi().updatePatientApiV1PatientsPatientIdPut(id, data);
        const updatedPatient = response.data;
        setPatients((prev) =>
          prev.map((patient) => (patient.id === id ? updatedPatient : patient))
        );
        return updatedPatient;
      } catch (err: any) {
          const errorMsg = extractErrorMessage(err) || 'Failed to update patient';
          setError(errorMsg);
          console.error('Error updating patient:', err);
          return null;
        } finally {
          setLoading(false);
        }
    },
    []
  );

  // Delete patient
  const deletePatient = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await getApi().deletePatientApiV1PatientsPatientIdDelete(id);
      setPatients((prev) => prev.filter((patient) => patient.id !== id));
      return true;
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err) || 'Failed to delete patient';
      setError(errorMsg);
      console.error('Error deleting patient:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Search patients
  const searchPatients = useCallback(async (query: string): Promise<boolean> => {
    if (query.length < 2) {
      fetchPatients();
      return true;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getApi().searchPatientsApiV1PatientsSearchGet({ query });
      setPatients(response.data || []);
      return true;
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err) || 'Search failed';
      setError(errorMsg);
      console.error('Search error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchPatients]);

  // Get patients by diagnosis
  const fetchPatientsByDiagnosis = useCallback(
    async (diagnosisId: number): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await getApi().getPatientsByDiagnosisApiV1PatientsDiagnosisDiagnosisIdGet(diagnosisId);
        setPatients(response.data || []);
        return true;
      } catch (err: any) {
        const errorMsg = extractErrorMessage(err) || 'Failed to load patients by diagnosis';
        setError(errorMsg);
        console.error('Error fetching patients by diagnosis:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get patients by ward
  const fetchPatientsByWard = useCallback(async (wardId: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await getApi().getPatientsByWardApiV1PatientsWardWardIdGet(wardId);
      setPatients(response.data || []);
      return true;
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err) || 'Failed to load patients by ward';
      setError(errorMsg);
      console.error('Error fetching patients by ward:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    patients,
    loading,
    error,
    fetchPatients,
    fetchPatient,
    createPatient,
    updatePatient,
    deletePatient,
    searchPatients,
    fetchPatientsByDiagnosis,
    fetchPatientsByWard,
  };
};
