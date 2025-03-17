// store.js
import { configureStore } from "@reduxjs/toolkit";
import micReducer from "../slice/slice";

const store = configureStore({
  reducer: {
    mic: micReducer,
  },
});

export default store;
