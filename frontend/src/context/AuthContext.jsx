import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Auth state context
const AuthContext = createContext();

// Initial state
const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
};

// Auth actions
export const AUTH_ACTIONS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
      };
      
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
      };
      
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload.loading,
      };
      
    default:
      return state;
  }
};

// Auth provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // Check for existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');
    
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { token, user: parsedUser },
        });
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      }
    }
    
    dispatch({
      type: AUTH_ACTIONS.SET_LOADING,
      payload: { loading: false },
    });
  }, []);
  
  // Login function
  const login = (token, user) => {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(user));
    
    dispatch({
      type: AUTH_ACTIONS.LOGIN_SUCCESS,
      payload: { token, user },
    });
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    
    dispatch({
      type: AUTH_ACTIONS.LOGOUT,
    });
  };
  
  const value = {
    ...state,
    login,
    logout,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
