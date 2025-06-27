import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const apiUrl = process.env.REACT_APP_BACKEND_URL;

// Async thunk for fetching data
export const fetchExcelData = createAsyncThunk(
  'excel/fetchExcelData',
  async (payload, { dispatch, rejectWithValue }) => {
    const country = payload.country || 'US';
    const asins = payload.asins;
    let displayData = [];
    let errorData = [];

    try {
      // Set initial loading state
      dispatch(setLoading(true));
      dispatch(setPercent(0));

      // Process ASINs one by one to update progress
      for (let i = 0; i < asins.length; i++) {
        const asin = asins[i];
        await axios.post(`${apiUrl}/asin/${country}`, { asin: asin })
          .then(response => {
            delete response.data['success']
            displayData = [...displayData, response.data];
            const progress = ((i + 1) / asins.length) * 100;
            dispatch(setPercent(progress));
          })
          .catch(error => {
            errorData = [...errorData, asin];
            const progress = ((i + 1) / asins.length) * 100;
            dispatch(setPercent(progress));
          });
      }

      console.log('Successfully fetched data for:', displayData.length, 'ASINs');
      console.log('Failed to fetch data for:', errorData.length, 'ASINs');
      return { success: displayData, error: errorData }
    } catch (error) {
      console.error('Error in fetchExcelData:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const excelSlice = createSlice({
  name: 'excel',
  initialState: {
    data: [],
    isLoading: false,
    selectedRow: null,
    error: null,
    percent: 0
  },
  reducers: {
    setSelectedRow: (state, action) => {
      state.selectedRow = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setPercent: (state, action) => {
      state.percent = action.payload;
    },
    clearData: (state) => {
      state.data = [];
      state.error = null;
      state.percent = 0;
      state.selectedRow = null;
      state.isLoading = false;
    },
    updateData: (state, action) => {
      state.data = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExcelData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.percent = 0;
      })
      .addCase(fetchExcelData.fulfilled, (state, action) => {
        state.data = action.payload;
        state.isLoading = false;
        state.percent = 100;
        state.error = null;
      })
      .addCase(fetchExcelData.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
        state.percent = 0;
      });
  }
});

export const {
  setSelectedRow,
  clearData,
  setLoading,
  setError,
  setPercent,
  updateData
} = excelSlice.actions;

export default excelSlice.reducer;
