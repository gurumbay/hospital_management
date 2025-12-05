import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from '@mui/material';

export type CRUDMode = 'view' | 'edit' | 'create';

interface CRUDModalProps {
  open: boolean;
  onClose: () => void;
  mode: CRUDMode;
  title: string;
  data?: any;
  children: React.ReactNode;
  onSave?: (data: any) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  onEdit?: () => void;
  loading?: boolean;
}

// Reusable CRUD modal dialog for view/edit/create operations
export const CRUDModal: React.FC<CRUDModalProps> = ({
  open,
  onClose,
  mode,
  title,
  data,
  children,
  onSave,
  onDelete,
  onEdit,
  loading = false,
}) => {
  const [isEditing, setIsEditing] = React.useState(mode === 'create' || mode === 'edit');

  React.useEffect(() => {
    setIsEditing(mode === 'create' || mode === 'edit');
  }, [mode]);

  const handleEdit = () => {
    setIsEditing(true);
    onEdit?.();
  };

  const handleSave = () => {
    onSave?.(data);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      onDelete?.();
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box>{children}</Box>
      </DialogContent>
      <DialogActions>
        {mode === 'view' && !isEditing && (
          <>
            <Button onClick={handleEdit} variant="contained">
              Edit
            </Button>
            <Button onClick={handleDelete} color="error">
              Delete
            </Button>
            <Button onClick={handleClose}>Close</Button>
          </>
        )}
        {isEditing && (
          <>
            <Button onClick={handleSave} variant="contained" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
