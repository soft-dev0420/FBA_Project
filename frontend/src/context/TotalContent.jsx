import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";

// Initial state with totals added
const initialState = {
  currentPage: 1,
  selectedBoxId: null,
  totalPages: 1,
  itemsPerPage: 15, // Changed from 5 to 15
  totals: { num: 0, expected: 0, boxed: 0 },
};

// Create context
const BoxContext = createContext();

// Reducer function to handle state updates
function boxReducer(state, action) {
  switch (action.type) {
    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.payload };
    case "SET_SELECTED_BOX":
      return { ...state, selectedBoxId: action.payload };
    case "SET_TOTAL_PAGES":
      return { ...state, totalPages: action.payload };
    case "SET_TOTALS":
      // Save to localStorage when totals change
      localStorage.setItem("boxTotals", JSON.stringify(action.payload));
      return { ...state, totals: action.payload };
    default:
      return state;
  }
}

// Provider component
export function BoxProvider({ children }) {
  // Load initial state from localStorage
  const loadInitialState = () => {
    try {
      const savedTotals = localStorage.getItem("boxTotals");
      if (savedTotals) {
        const parsedTotals = JSON.parse(savedTotals);
        return {
          ...initialState,
          totals: parsedTotals,
        };
      }
    } catch (error) {
      console.error("Error loading saved totals:", error);
    }
    return initialState;
  };

  const [state, dispatch] = useReducer(boxReducer, loadInitialState());

  // Actions
  const setCurrentPage = useCallback((page) => {
    dispatch({ type: "SET_CURRENT_PAGE", payload: page });
  }, []);

  const setSelectedBox = useCallback(
    (boxId) => {
      dispatch({ type: "SET_SELECTED_BOX", payload: boxId });

      // When a box is selected, calculate which page it's on
      if (boxId !== null && boxId > 11) {
        const adjustedId = boxId - 12;
        const pageForBox = Math.floor(adjustedId / state.itemsPerPage) + 1;
        if (pageForBox !== state.currentPage) {
          setCurrentPage(pageForBox);
        }
      }
    },
    [state.itemsPerPage, state.currentPage]
  );

  const setTotalPages = useCallback((pages) => {
    dispatch({ type: "SET_TOTAL_PAGES", payload: pages });
  }, []);

  // Add new action for totals
  const setTotals = useCallback((totals) => {
    dispatch({ type: "SET_TOTALS", payload: totals });
  }, []);

  // Value object - add setTotals
  const value = {
    state,
    actions: {
      setCurrentPage,
      setSelectedBox,
      setTotalPages,
      setTotals,
    },
  };

  return <BoxContext.Provider value={value}>{children}</BoxContext.Provider>;
}

// Custom selector hook (similar to useSelector)
export function useBoxSelector(selector) {
  const context = useContext(BoxContext);
  if (context === undefined) {
    throw new Error("useBoxSelector must be used within a BoxProvider");
  }
  return selector(context);
}

// Convenience hooks for common selections
export function useBoxState() {
  return useBoxSelector((context) => context.state);
}

export function useBoxActions() {
  return useBoxSelector((context) => context.actions);
}
