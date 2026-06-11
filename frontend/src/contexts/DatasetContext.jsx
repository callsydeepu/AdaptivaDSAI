import React, { createContext, useState, useEffect, useContext } from "react";
import { datasetService } from "../services/datasetService";

const DatasetContext = createContext();

export function DatasetProvider({ children }) {
  const [datasets, setDatasets] = useState([]);
  const [currentDatasetId, setCurrentDatasetId] = useState("");
  const [isDatasetLoading, setIsDatasetLoading] = useState(false);
  const [datasetError, setDatasetError] = useState(null);

  const DEMO_DATASETS = [
    {
      dataset_id: "demo-titanic-survival",
      filename: "titanic_survival_demo.csv",
      rows: 891,
      columns: 12,
      problem_type: "Classification",
      uploaded_at: new Date().toISOString()
    },
    {
      dataset_id: "demo-house-pricing",
      filename: "house_prices_demo.csv",
      rows: 1460,
      columns: 81,
      problem_type: "Regression",
      uploaded_at: new Date().toISOString()
    }
  ];

  const refreshDatasets = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setDatasets(DEMO_DATASETS);
      if (!currentDatasetId) {
        setCurrentDatasetId("demo-titanic-survival");
      }
      return;
    }

    setIsDatasetLoading(true);
    setDatasetError(null);
    try {
      const data = await datasetService.getDatasets();
      setDatasets(data);
      if (data.length > 0) {
        if (!data.some(d => d.dataset_id === currentDatasetId) && currentDatasetId !== "demo-titanic-survival" && currentDatasetId !== "demo-house-pricing") {
          setCurrentDatasetId(data[0].dataset_id);
        } else if (!currentDatasetId || currentDatasetId === "demo-titanic-survival" || currentDatasetId === "demo-house-pricing") {
          setCurrentDatasetId(data[0].dataset_id);
        }
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
