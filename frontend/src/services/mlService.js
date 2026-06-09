import api from "./api";

export const mlService = {
  getRecommendations: async (datasetId) => {
    const response = await api.get(`/model-recommendation/${datasetId}`);
    return response.data;
  },

  startTraining: async (datasetId) => {
    const response = await api.post(`/train/${datasetId}`);
    return response.data;
  },

  getJobStatus: async (jobId) => {
    const response = await api.get(`/jobs/${jobId}`);
    return response.data;
  },

  getEvaluation: async (datasetId) => {
    const response = await api.get(`/evaluation/${datasetId}`);
    return response.data;
  },
};
