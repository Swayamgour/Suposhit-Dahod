import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from './api';
// import authReducer from './slices/authSlice';
// import uiReducer from './slices/uiSlice';
// import filterReducer from './slices/filterSlice';

export const store = configureStore({
    reducer: {
        // RTK Query reducer
        [api.reducerPath]: api.reducer,

        // // Local state reducers
        // auth: authReducer,
        // ui: uiReducer,
        // filters: filterReducer,
    },

    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }).concat(api.middleware),

    devTools: 'production',
});

// Enable refetchOnFocus and refetchOnReconnect
setupListeners(store.dispatch);