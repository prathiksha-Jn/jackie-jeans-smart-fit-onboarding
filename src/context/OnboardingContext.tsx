/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FitProfile, INITIAL_FIT_PROFILE } from '../types';

interface OnboardingContextProps {
  fitProfile: FitProfile;
  setFitProfile: React.Dispatch<React.SetStateAction<FitProfile>>;
  updateField: <K extends keyof FitProfile>(field: K, value: FitProfile[K]) => void;
  updateBrandSize: (brand: string, size: string) => void;
  removeBrandSize: (brand: string) => void;
  resetProfile: () => void;
  method: 'manual' | 'voice' | null;
  setMethod: (method: 'manual' | 'voice' | null) => void;
}

const OnboardingContext = createContext<OnboardingContextProps | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [fitProfile, setFitProfile] = useState<FitProfile>(INITIAL_FIT_PROFILE);
  const [method, setMethod] = useState<'manual' | 'voice' | null>(null);

  const updateField = <K extends keyof FitProfile>(field: K, value: FitProfile[K]) => {
    setFitProfile((prev) => {
      if (field === 'brands') {
        const nextBrands = value as string[];
        const nextBrandSizes = { ...prev.brandSizes };
        Object.keys(nextBrandSizes).forEach((b) => {
          if (!nextBrands.includes(b)) {
            delete nextBrandSizes[b];
          }
        });
        return {
          ...prev,
          brands: nextBrands,
          brandSizes: nextBrandSizes,
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const updateBrandSize = (brand: string, size: string) => {
    setFitProfile((prev) => ({
      ...prev,
      brandSizes: {
        ...prev.brandSizes,
        [brand]: size,
      },
    }));
  };

  const removeBrandSize = (brand: string) => {
    setFitProfile((prev) => {
      const brandSizes = { ...prev.brandSizes };
      delete brandSizes[brand];
      return {
        ...prev,
        brandSizes,
      };
    });
  };

  const resetProfile = () => {
    setFitProfile(INITIAL_FIT_PROFILE);
    setMethod(null);
  };

  return (
    <OnboardingContext.Provider
      value={{
        fitProfile,
        setFitProfile,
        updateField,
        updateBrandSize,
        removeBrandSize,
        resetProfile,
        method,
        setMethod,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}