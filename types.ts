import React from 'react';

export enum SimulationType {
  HOME = 'HOME',
  EM_WAVE = 'EM_WAVE',
  IDEAL_GAS = 'IDEAL_GAS',
  LEVER_EQUILIBRIUM = 'LEVER_EQUILIBRIUM',
  VECTOR_FIELD = 'VECTOR_FIELD',
  FARADAY_LAW = 'FARADAY_LAW',
  GRADIENT = 'GRADIENT',
  CONTACT = 'CONTACT'

}

export interface SimulationConfig {
  id: SimulationType;
  title: string;
  description: string;
  thumbnailIcon: React.ReactNode;
}