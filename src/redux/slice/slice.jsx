// micSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const checkMicrophonePermissions = createAsyncThunk(
  "mic/checkPermissions",
  async (_, { rejectWithValue }) => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (error) {
      console.error("Microphone permission error:", error);
      return rejectWithValue(false);
    }
  }
);

const micSlice = createSlice({
  name: "mic",
  initialState: {
    microphoneAccess: false,
    status: "idle", // "idle" | "loading" | "succeeded" | "failed"
    error: null,
  },
  reducers: {
    // you can add additional reducers if needed
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkMicrophonePermissions.pending, (state) => {
        state.status = "loading";
      })
      .addCase(checkMicrophonePermissions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.microphoneAccess = action.payload; // true in this case
      })
      .addCase(checkMicrophonePermissions.rejected, (state, action) => {
        state.status = "failed";
        state.microphoneAccess = false;
        state.error = action.payload;
      });
  },
});

export default micSlice.reducer;
