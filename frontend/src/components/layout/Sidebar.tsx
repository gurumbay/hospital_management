import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  Collapse,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  LocalHospital as HospitalIcon,
  MeetingRoom as RoomIcon,
  Assessment as ReportIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  SwapHoriz as DistributionIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../../utils/constants/routes';

const drawerWidth = 240;

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
}

interface MenuGroup {
  group: string;
  items: MenuItem[];
}

type MenuStructureItem = MenuItem | MenuGroup;

// Menu structure with groups and submenus
const menuStructure: MenuStructureItem[] = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: ROUTES.DASHBOARD,
  },
  {
    group: 'REFERENCES',
    items: [
      {
        text: 'Patients',
        icon: <PeopleIcon />,
        path: ROUTES.PATIENTS,
      },
      {
        text: 'Diagnoses',
        icon: <HospitalIcon />,
        path: ROUTES.DIAGNOSES,
      },
      {
        text: 'Wards',
        icon: <RoomIcon />,
        path: ROUTES.WARDS,
      },
    ],
  },
  {
    group: 'JOURNALS',
    items: [
      {
        text: 'Distribution',
        icon: <DistributionIcon />,
        path: '/distribution',
      },
    ],
  },
  {
    group: 'REPORTS',
    items: [
      {
        text: 'Ward Occupancy',
        icon: <BarChartIcon />,
        path: '/reports/occupancy',
      },
      {
        text: 'Diagnosis Statistics',
        icon: <ReportIcon />,
        path: '/reports/diagnosis-stats',
      },
    ],
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    'REFERENCES',
  ]);

  const handleGroupClick = (group: string) => {
    setExpandedGroups((prev) =>
      prev.includes(group)
        ? prev.filter((g) => g !== group)
        : [...prev, group]
    );
  };

  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ overflow: 'auto' }}>
        {/* Header */}
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h6" component="div">
            Hospital
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Management System
          </Typography>
        </Box>

        <Divider />

        {/* Menu Items */}
        <List sx={{ pt: 0 }}>
          {menuStructure.map((item, index) => {
            // Single menu item without group
            if ('path' in item) {
              const menuItem = item as MenuItem;
              return (
                <ListItem key={index} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={menuItem.path}
                    selected={isActive(menuItem.path)}
                    sx={{
                      '&.Mui-selected': {
                        backgroundColor: 'primary.light',
                        color: 'primary.main',
                        '&:hover': {
                          backgroundColor: 'primary.light',
                        },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: isActive(menuItem.path)
                          ? 'primary.main'
                          : 'inherit',
                        minWidth: 40,
                      }}
                    >
                      {menuItem.icon}
                    </ListItemIcon>
                    <ListItemText primary={menuItem.text} />
                  </ListItemButton>
                </ListItem>
              );
            }

            // Grouped menu items
            const group = item as MenuGroup;
            const groupName = group.group;
            const isExpanded = expandedGroups.includes(groupName);

            return (
              <React.Fragment key={index}>
                <ListItemButton
                  onClick={() => handleGroupClick(groupName)}
                  sx={{
                    backgroundColor: 'action.hover',
                    '&:hover': {
                      backgroundColor: 'action.selected',
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography
                        variant="overline"
                        sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}
                      >
                        {groupName}
                      </Typography>
                    }
                  />
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItemButton>

                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {group.items.map((subItem, subIndex) => (
                      <ListItem key={subIndex} disablePadding sx={{ pl: 2 }}>
                        <ListItemButton
                          component={Link}
                          to={subItem.path}
                          selected={isActive(subItem.path)}
                          sx={{
                            '&.Mui-selected': {
                              backgroundColor: 'primary.light',
                              color: 'primary.main',
                              '&:hover': {
                                backgroundColor: 'primary.light',
                              },
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              color: isActive(subItem.path)
                                ? 'primary.main'
                                : 'inherit',
                              minWidth: 40,
                            }}
                          >
                            {subItem.icon}
                          </ListItemIcon>
                          <ListItemText primary={subItem.text} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
