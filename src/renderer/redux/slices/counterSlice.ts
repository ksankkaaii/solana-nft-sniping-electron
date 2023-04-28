import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CounterState {
  theme: any[]
}

const initialState: CounterState = {
  theme: [],
};

export const counterSlice = createSlice({
  name: "counter",
  initialState,
  reducers: {
    setTheme: (state: any, action: PayloadAction<{}[]>) => {
      state.theme = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setTheme } = counterSlice.actions;

export default counterSlice.reducer;
