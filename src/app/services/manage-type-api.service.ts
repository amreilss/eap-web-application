import { Injectable } from '@angular/core';

export interface ManageTypeDetail {
  recipeName: string;
  bladeTypeZ1: string;
  bladeTypeZ2: string;
  prodStockZ1: string;
  prodStockZ2: string;
  prodStockZ1_2nd: string;
  prodStockZ2_2nd: string;
  lastUpdate: string;
  createdByLot: string;
}

export interface ManageTypeUpsertPayload {
  lotNoNew: string;
  recipe: string;
  isTaiko: boolean;
  bladeZ1: string | null;
  bladeZ2: string | null;
  bladeZ1_2nd: string | null;
  bladeZ2_2nd: string | null;
}

@Injectable()
export class ManageTypeApiService {
  private MOCK_RECIPE: Record<string, string> = {
    'MIPDS0233.1': 'MXM3344E_A',
    'MIPDS0456.2': 'RECIPE-B',
    'MIPDS0789.3': 'RECIPE-C',
    'MIPDS0999.1': 'RECIPE-D',
  };

  private MOCK_DB: Record<string, ManageTypeDetail> = {
    'MIPDS0233.1': {
      recipeName: 'MXM3344E_A',
      bladeTypeZ1: '05SD3500N170DD',
      bladeTypeZ2: '05SD4000N130BB',
      prodStockZ1: 'SW00000109',
      prodStockZ2: 'SW00000202',
      prodStockZ1_2nd: 'SW00000333',
      prodStockZ2_2nd: 'SW00000444',
      lastUpdate: '2026-03-20 10:30',
      createdByLot: 'MIPDS0233.1',
    },
    'MIPDS0456.2': {
      recipeName: 'RECIPE-B',
      bladeTypeZ1: 'TYPE-001',
      bladeTypeZ2: 'TYPE-003',
      prodStockZ1: 'SW00000555',
      prodStockZ2: 'SW00000666',
      prodStockZ1_2nd: 'SW00000777',
      prodStockZ2_2nd: 'SW00000888',
      lastUpdate: '2026-03-18 14:05',
      createdByLot: 'MIPDS0456.2',
    },
  };

  async getRecipeName(lot: string): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(this.MOCK_RECIPE[lot] || ''), 250);
    });
  }

  async getDetail(lot: string): Promise<ManageTypeDetail | null> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(this.MOCK_DB[lot] || null), 250);
    });
  }

  async insert(payload: ManageTypeUpsertPayload): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.MOCK_RECIPE[payload.lotNoNew] = payload.recipe;

        this.MOCK_DB[payload.lotNoNew] = {
          recipeName: payload.recipe,
          bladeTypeZ1: payload.bladeZ1 || '',
          bladeTypeZ2: payload.bladeZ2 || '',
          prodStockZ1: payload.bladeZ1 || '',
          prodStockZ2: payload.bladeZ2 || '',
          prodStockZ1_2nd: payload.bladeZ1_2nd || '',
          prodStockZ2_2nd: payload.bladeZ2_2nd || '',
          lastUpdate: new Date().toLocaleString(),
          createdByLot: payload.lotNoNew,
        };

        resolve();
      }, 400);
    });
  }

  async update(payload: ManageTypeUpsertPayload): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const old = this.MOCK_DB[payload.lotNoNew];

        this.MOCK_DB[payload.lotNoNew] = {
          recipeName: payload.recipe,
          bladeTypeZ1: payload.bladeZ1 || '',
          bladeTypeZ2: payload.bladeZ2 || '',
          prodStockZ1: old?.prodStockZ1 || payload.bladeZ1 || '',
          prodStockZ2: old?.prodStockZ2 || payload.bladeZ2 || '',
          prodStockZ1_2nd: payload.bladeZ1_2nd || '',
          prodStockZ2_2nd: payload.bladeZ2_2nd || '',
          lastUpdate: new Date().toLocaleString(),
          createdByLot: old?.createdByLot || payload.lotNoNew,
        };

        resolve();
      }, 400);
    });
  }
}