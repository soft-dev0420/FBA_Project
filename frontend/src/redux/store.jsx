import { configureStore } from '@reduxjs/toolkit';
import excelReducer from './reducers/excelReducer';

export const store = configureStore({
  reducer: {
    excel: excelReducer
  }
}); 