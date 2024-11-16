// src/types/finds.ts

export interface Find {
    id: string;
    name: string;
    date: string;
    location: string;
    coordinates: string;
    what3words: string;
    depth: string;
    metalType: string;
    condition: string;
    notes: string;
    imageUrl: string;
    createdAt?: Date;
  }
  
  export type NewFind = Omit<Find, 'id' | 'imageUrl' | 'createdAt'>;  