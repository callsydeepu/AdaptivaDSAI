import api from "./api";

export const datasetService = {
  uploadDataset: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });
    return response.data;
  },

  getDatasets: async () => {
    const response = await api.get("/datasets");
    return response.data;
  },

  getDataset: async (datasetId) => {
    const response = await api.get(`/datasets/${datasetId}`);
    return response.data;
  },

  deleteDataset: async (datasetId) => {
    const response = await api.delete(`/datasets/${datasetId}`);
    return response.data;
  },
};
