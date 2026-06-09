import React, { createContext, useState, useEffect, useContext } from "react";
import { datasetService } from "../services/datasetService";

const DatasetContext = createContext();

export function DatasetProvider({ children }) {
  const [datasets, setDatasets] = useState([]);
  const [currentDatasetId, setCurrentDatasetId] = useState("");
  const [isDatasetLoading, setIsDatasetLoading] = useState(false);
  const [datasetError, setDatasetError] = useState(null);

  const refreshDatasets = async () => {
    setIsDatasetLoading(true);
    setDatasetError(null);
    try {
      const data = await datasetService.getDatasets();
      setDatasets(data);
      if (data.length > 0 && !currentDatasetId) {
        // Set first dataset by default if not set
        setCurrentDatasetId(data[0].dataset_id);
      }
    } catch (err) {
      setDatasetError(err);
      console.error("Failed to load datasets:", err);
    } finally {
      setIsDatasetLoading(false);
    }
  };

  useEffect(() => {
    refreshDatasets();
  }, []);

  const selectDataset = (id) => {
    setCurrentDatasetId(id);
  };

  const currentDataset = datasets.find((d) => d.dataset_id === currentDatasetId) || null;

  return (
    <DatasetContext.Provider
      value={{
        datasets,
        currentDatasetId,
        currentDataset,
        isDatasetLoading,
        datasetError,
        selectDataset,
        refreshDatasets,
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset() {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error("useDataset must be used within a DatasetProvider");
  }
  return context;
}
