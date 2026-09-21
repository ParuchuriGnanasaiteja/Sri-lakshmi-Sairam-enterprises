import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserProfile, Dealer } from '../types';
import { initialDealers } from '../db/seedData';

interface AuthContextType {
  user: UserProfile | null;
  currentDealer: Dealer | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (role: UserRole, mobileOrEmail: string, dealerId?: string) => void;
  logout: () => void;
  switchDealer: (dealerId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_USER: UserProfile = {
  id: 'usr-admin-1',
  role: 'admin',
  name: 'G. Venkateswara Rao (Distributor)',
  mobile: '9848012345',
  email: 'sairamenterprises.cherukupalli@gmail.com'
};

const STAFF_USER: UserProfile = {
  id: 'usr-staff-1',
  role: 'staff',
  name: 'B. Srinivas (Billing Staff)',
  mobile: '9848012346',
  email: 'staff.sairam@gmail.com'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('sls_auth_user');
    return saved ? JSON.parse(saved) : ADMIN_USER;
  });

  const [currentDealer, setCurrentDealer] = useState<Dealer | null>(() => {
    const savedDealerId = localStorage.getItem('sls_auth_dealer_id');
    if (savedDealerId) {
      return initialDealers.find(d => d.id === savedDealerId) || initialDealers[0];
    }
    return user?.role === 'dealer' && user.dealer_id 
      ? initialDealers.find(d => d.id === user.dealer_id) || initialDealers[0]
      : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('sls_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('sls_auth_user');
    }
  }, [user]);

  useEffect(() => {
    if (currentDealer) {
      localStorage.setItem('sls_auth_dealer_id', currentDealer.id);
    } else {
      localStorage.removeItem('sls_auth_dealer_id');
    }
  }, [currentDealer]);

  const login = (role: UserRole, _mobileOrEmail: string, dealerId?: string) => {
    if (role === 'admin') {
      setUser(ADMIN_USER);
      setCurrentDealer(null);
    } else if (role === 'staff') {
      setUser(STAFF_USER);
      setCurrentDealer(null);
    } else {
      const selectedDealer = initialDealers.find(d => d.id === dealerId) || initialDealers[0];
      const dealerUser: UserProfile = {
        id: `usr-${selectedDealer.id}`,
        role: 'dealer',
        name: selectedDealer.name,
        mobile: selectedDealer.mobile,
        email: selectedDealer.email,
        dealer_id: selectedDealer.id
      };
      setUser(dealerUser);
      setCurrentDealer(selectedDealer);
    }
  };

  const switchDealer = (dealerId: string) => {
    const d = initialDealers.find(item => item.id === dealerId);
    if (d) {
      setCurrentDealer(d);
      if (user && user.role === 'dealer') {
        setUser({
          ...user,
          id: `usr-${d.id}`,
          name: d.name,
          mobile: d.mobile,
          email: d.email,
          dealer_id: d.id
        });
      }
    }
  };

  const logout = () => {
    setUser(null);
    setCurrentDealer(null);
    localStorage.removeItem('sls_auth_user');
    localStorage.removeItem('sls_auth_dealer_id');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentDealer,
        role: user?.role || 'dealer',
        isAuthenticated: Boolean(user),
        login,
        logout,
        switchDealer
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
