import apiClient from './apiClient';

export interface Warengruppe {
  id: number;
  bezeichnung: string;
  beschreibung: string | null;
  erloes_konto: string | null;
  mwst_code: string | null;
  aktiv: number;
}

const warengruppenService = {
  getAll: async (): Promise<Warengruppe[]> => {
    const response = await apiClient.get('/warengruppen');
    return response.data;
  },

  getById: async (id: number): Promise<Warengruppe> => {
    const response = await apiClient.get(`/warengruppen/${id}`);
    return response.data;
  },
};

export default warengruppenService;