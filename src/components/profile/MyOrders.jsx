import React, { useEffect, useState } from 'react'
import { FaShoppingCart } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import api from '../../api/api';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    pageNumber: 0,
    pageSize: 10,
    totalElements: 0,
    totalPages: 1,
    lastPage: false
  });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Fetch user orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const pageNum = searchParams.get("page") ? Number(searchParams.get("page")) - 1 : 0;
        const { data } = await api.get(`/users/orders?pageNumber=${pageNum}&pageSize=10`);
        
        setOrders(data.content || []);
        setPagination({
          pageNumber: data.pageNumber || 0,
          pageSize: data.pageSize || 10,
          totalElements: data.totalElements || 0,
          totalPages: data.totalPages || 1,
          lastPage: data.lastPage || false
        });
        setCurrentPage(pageNum + 1);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [searchParams]);

  const tableRecords = orders?.map((item) => ({
    id: item.orderId,
    email: item.email,
    totalAmount: `₹${item.totalAmount.toFixed(2)}`,
    status: item.orderStatus,
    date: item.orderDate,
    paymentMethod: item.payment?.pgName || 'N/A',
    items: item.orderItems?.length || 0,
  }));

  const columns = [
    { field: 'id', headerName: 'Order ID', width: 100, filterable: false, sortable: false },
    { field: 'date', headerName: 'Order Date', width: 120, filterable: false, sortable: false },
    { field: 'items', headerName: 'Items', width: 80, filterable: false, sortable: false },
    { field: 'totalAmount', headerName: 'Total Amount', width: 120, filterable: false, sortable: false },
    { field: 'paymentMethod', headerName: 'Payment', width: 100, filterable: false, sortable: false },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      filterable: false,
      sortable: false,
      renderCell: (params) => (
        <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${
          params.value === 'Accepted' || params.value === 'Delivered'
            ? 'bg-green-500'
            : params.value === 'Pending'
            ? 'bg-yellow-500'
            : 'bg-red-500'
        }`}>
          {params.value}
        </span>
      )
    },
  ];

  const handlePaginationChange = (paginationModel) => {
    const page = paginationModel.page + 1;
    setCurrentPage(page);
    navigate(`/profile/orders?page=${page}`);
  };

  const emptyOrders = !orders || orders.length === 0;

  return (
    <div className='pb-6 pt-20 px-4 max-w-6xl mx-auto'>
      <h1 className='text-slate-800 text-3xl text-center font-bold pb-6 uppercase'>
        My Orders
      </h1>

      {emptyOrders ? (
        <div className='flex flex-col items-center justify-center text-gray-600 py-20'>
          <FaShoppingCart size={60} className='mb-4 text-gray-400'/>
          <h2 className='text-2xl font-semibold'>No Orders Placed Yet</h2>
          <p className='text-gray-500 mt-2'>Start shopping to place your first order!</p>
        </div>
      ) : (
        <div className='bg-white rounded-lg shadow-md p-4'>
          <DataGrid
            className='w-full'
            rows={tableRecords}
            columns={columns}
            paginationMode='server'
            rowCount={pagination.totalElements || 0}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: pagination.pageSize || 10,
                  page: currentPage - 1,
                },
              },
            }}
            onPaginationModelChange={handlePaginationChange}
            loading={loading}
            disableRowSelectionOnClick
            disableColumnResize
            pageSizeOptions={[pagination.pageSize || 10]}
            pagination
            paginationOptions={{
              showFirstButton: true,
              showLastButton: true,
              hideNextButton: currentPage === pagination.totalPages,
            }}
            sx={{
              '& .MuiDataGrid-root': { border: 'none' },
              '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f5f5f5' },
              '& .MuiDataGrid-cell': { borderBottom: '1px solid #eee' },
            }}
          />
        </div>
      )}
    </div>
  );
};

export default MyOrders;
