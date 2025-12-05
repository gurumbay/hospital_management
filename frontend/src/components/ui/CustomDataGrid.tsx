import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Box,
  CircularProgress,
} from '@mui/material';

interface Column {
  field: string;
  headerName: string;
  width?: number | string;
  renderCell?: (value: any, row: any) => React.ReactNode;
}

interface CustomDataGridProps {
  data: any[];
  columns: Column[];
  onRowClick?: (row: any) => void;
  loading?: boolean;
}

// Custom DataGrid component using MUI Table (no external data grid library)
export const CustomDataGrid: React.FC<CustomDataGridProps> = ({
  data,
  columns,
  onRowClick,
  loading = false,
}) => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ position: 'relative' }}>
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <TableContainer component={Paper} sx={{ opacity: loading ? 0.5 : 1 }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  sx={{
                    width: column.width,
                    fontWeight: 'bold',
                    textAlign: 'left',
                  }}
                >
                  {column.headerName}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row, index) => (
              <TableRow
                key={row.id || index}
                onClick={() => onRowClick?.(row)}
                sx={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  '&:hover': {
                    backgroundColor: onRowClick ? '#f5f5f5' : 'inherit',
                  },
                }}
              >
                {columns.map((column) => (
                  <TableCell key={column.field}>
                    {column.renderCell
                      ? column.renderCell(row[column.field], row)
                      : row[column.field]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={data.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Rows per page:"
      />
    </Box>
  );
};
