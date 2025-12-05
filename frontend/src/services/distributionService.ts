// Service for ward distribution logic
// Suggests which ward a patient should be assigned to
import type { WardResponse } from '../api/generated';

const normalizeWard = (ward: WardResponse): { id: number; name: string; max_capacity: number; current_occupancy: number } => {
  return {
    id: ward.id!,
    name: ward.name || '',
    max_capacity: ward.max_capacity,
    current_occupancy: ward.current_occupancy || 0,
  };
};

interface Ward {
  id: number;
  name: string;
  max_capacity: number;
  current_occupancy: number;
}

export const distributionService = {
  // Suggests the best ward for a patient
  suggestWard: (wards: (WardResponse | Ward)[]): WardResponse | Ward | null => {
    if (!wards || wards.length === 0) return null;

    // Normalize wards
    const normalizedWards = wards.map((w) =>
      'current_occupancy' in w && typeof w.current_occupancy === 'object'
        ? normalizeWard(w as WardResponse)
        : w as Ward
    );

    // 1. Find empty ward
    const emptyWard = normalizedWards.find((ward) => ward.current_occupancy === 0);
    if (emptyWard) return wards[normalizedWards.indexOf(emptyWard)];

    // 2. Find ward with minimum occupancy rate
    const minWard = normalizedWards.reduce((minWard, ward) => {
      const occupancyPercent = (ward.current_occupancy / ward.max_capacity) * 100;
      const minOccupancyPercent = (minWard.current_occupancy / minWard.max_capacity) * 100;
      return occupancyPercent < minOccupancyPercent ? ward : minWard;
    });

    return wards[normalizedWards.indexOf(minWard)];
  },

  // Calculates occupancy percentage for a ward
  getOccupancyPercent: (ward: WardResponse | Ward): number => {
    const normalized = 'current_occupancy' in ward && ward.current_occupancy === undefined
      ? { ...ward, current_occupancy: 0 }
      : ward;
    const occupancy = normalized.current_occupancy || 0;
    return Math.round((occupancy / normalized.max_capacity) * 100);
  },

  // Calculates free beds in a ward
  getFreeBeds: (ward: WardResponse | Ward): number => {
    const occupancy = (ward.current_occupancy || 0);
    return Math.max(0, ward.max_capacity - occupancy);
  },

  // Checks if ward has available beds
  hasAvailableBeds: (ward: WardResponse | Ward): boolean => {
    const occupancy = (ward.current_occupancy || 0);
    return occupancy < ward.max_capacity;
  },

  // Gets occupancy status color for UI
  getOccupancyStatusColor: (ward: WardResponse | Ward): string => {
    const percent = distributionService.getOccupancyPercent(ward);
    if (percent >= 90) return '#d32f2f'; // Error red
    if (percent >= 70) return '#ed6c02'; // Warning orange
    return '#2e7d32'; // Success green
  },
};
