import api from "./api";

export const analysisService = {
  getProfiling: async (datasetId) => {
    const response = await api.get(`/datasets/${datasetId}/profile`);
    return response.data;
  },

  getStatistics: async (datasetId) => {
    const response = await api.get(`/datasets/${datasetId}/statistics`);
    return response.data;
  },

  getEDA: async (datasetId) => {
    const response = await api.get(`/datasets/${datasetId}/eda`);
    return response.data;
  },

  getProblemDetection: async (datasetId) => {
    const response = await api.get(`/problem-detection/${datasetId}`);
    return response.data;
  },
};
