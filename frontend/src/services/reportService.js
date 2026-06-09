import api from "./api";

export const reportService = {
  generateReport: async (datasetId) => {
    const response = await api.get(`/reports/generate/${datasetId}`);
    return response.data;
  },

  downloadReportUrl: (datasetId) => {
    return `${api.defaults.baseURL}/reports/download/${datasetId}`;
  },
};
