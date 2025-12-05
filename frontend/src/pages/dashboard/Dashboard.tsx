import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  LocalHospital as HospitalIcon,
  MeetingRoom as RoomIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { getApi } from '../../services/api/client';
import { distributionService } from '../../services/distributionService';
import type { PatientResponse, DiagnosisResponse, WardResponse } from '../../api/generated';

interface DashboardStats {
  patients: PatientResponse[];
  diagnoses: DiagnosisResponse[];
  wards: WardResponse[];
  loading: boolean;
  error: string | null;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    patients: [],
    diagnoses: [],
    wards: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setStats((prev) => ({ ...prev, loading: true, error: null }));

      const [patientsResp, diagnosesResp, wardsResp] = await Promise.all([
        getApi().getPatientsApiV1PatientsGet(),
        getApi().getDiagnosesApiV1DiagnosesGet(),
        getApi().getWardsApiV1WardsGet(),
      ]);

      setStats({
        patients: patientsResp.data || [],
        diagnoses: diagnosesResp.data || [],
        wards: wardsResp.data || [],
        loading: false,
        error: null,
      });
    } catch (err: any) {
      setStats((prev) => ({
        ...prev,
        loading: false,
        error: 'Failed to load dashboard data',
      }));
      console.error('Dashboard error:', err);
    }
  };

  const calculateAverageOccupancy = (wards: WardResponse[]): number => {
    if (wards.length === 0) return 0;
    const totalOccupancy = wards.reduce((sum, w) => sum + distributionService.getOccupancyPercent(w), 0);
    return Math.round(totalOccupancy / wards.length);
  };

  if (stats.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  const averageOccupancy = calculateAverageOccupancy(stats.wards);

  const statCards = [
    {
      title: 'Patients',
      value: stats.patients.length,
      icon: PeopleIcon,
      color: '#1976d2',
      description: 'Total patients',
    },
    {
      title: 'Diagnoses',
      value: stats.diagnoses.length,
      icon: HospitalIcon,
      color: '#2e7d32',
      description: 'Established diagnoses',
    },
    {
      title: 'Wards',
      value: stats.wards.length,
      icon: RoomIcon,
      color: '#ed6c02',
      description: 'Total wards',
    },
    {
      title: 'Occupancy',
      value: `${averageOccupancy}%`,
      icon: TrendingUpIcon,
      color: '#9c27b0',
      description: 'Average ward occupancy',
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome to the hospital management system
      </Typography>

      {stats.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {stats.error}
        </Alert>
      )}

      {/* Statistics */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
        {statCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <Card key={card.title}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      backgroundColor: `${card.color}20`,
                      borderRadius: 2,
                      p: 1,
                      mr: 2,
                    }}
                  >
                    <IconComponent sx={{ color: card.color, fontSize: 28 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" component="div">
                      {card.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.title}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {card.description}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Information blocks */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Patients
          </Typography>
          {stats.patients.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No patients yet
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {stats.patients.slice(0, 4).map((patient) => (
                <Box
                  key={patient.id}
                  sx={{
                    p: 2,
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                >
                  <Typography variant="body2">
                    {patient.first_name} {patient.last_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {patient.id} • Ward: {patient.ward_id ? `#${patient.ward_id}` : 'Unassigned'}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Ward Occupancy
          </Typography>
          {stats.wards.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No wards available
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {stats.wards.slice(0, 4).map((ward) => {
                const occupancyPercent = distributionService.getOccupancyPercent(ward);
                return (
                  <Box key={ward.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{ward.name}</Typography>
                      <Typography variant="body2">
                        {occupancyPercent}% ({ward.current_occupancy || 0}/{ward.max_capacity})
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={occupancyPercent}
                      color={occupancyPercent >= 90 ? 'error' : occupancyPercent >= 75 ? 'warning' : 'primary'}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                );
              })}
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;
