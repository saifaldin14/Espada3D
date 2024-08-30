import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { createNewModel, selectModel } from "../store/slices/modelSlice";
import { setActiveTool } from "../store/slices/uiSlice";
import { FaArrowsAlt, FaSyncAlt, FaPlus } from "react-icons/fa";
import { FaArrowsLeftRight } from "react-icons/fa6";

const Sidebar: React.FC = () => {
  const models = useSelector((state: any) => state.models.models);
  const selectedModelId = useSelector(
    (state: any) => state.models.selectedModelId
  );
  const activeTool = useSelector((state: any) => state.ui.activeTool);
  const dispatch = useDispatch();

  const handleModelSelect = (id: string) => {
    dispatch(selectModel(id));
  };

  const handleToolSelect = (tool: "translate" | "rotate" | "scale") => {
    dispatch(setActiveTool(tool));
  };

  const handleCreateModel = () => {
    dispatch(createNewModel({ type: "box" }));
  };

  return (
    <>
      <div style={styles.sidebar}>
        <h3>Models</h3>
        <ul style={styles.modelList}>
          {models.map((model: any, index: number) => (
            <li
              key={index}
              style={{
                ...styles.modelItem,
                backgroundColor:
                  model.id === selectedModelId ? "#1abc9c" : "#34495e", // Highlight selected model
              }}
              onClick={() => handleModelSelect(model.id)} // Pass the model ID
            >
              Model {index + 1}
            </li>
          ))}
        </ul>
      </div>
      <div style={styles.toolbar}>
        <h3>Controls</h3>
        <div style={styles.toolButtons}>
          <button
            style={{
              ...styles.toolButton,
              background: activeTool === "translate" ? "#16a085" : "#1abc9c",
            }}
            onClick={() => handleToolSelect("translate")}
          >
            <FaArrowsAlt />
          </button>
          <button
            style={{
              ...styles.toolButton,
              background: activeTool === "rotate" ? "#16a085" : "#1abc9c",
            }}
            onClick={() => handleToolSelect("rotate")}
          >
            <FaSyncAlt />
          </button>
          <button
            style={{
              ...styles.toolButton,
              background: activeTool === "scale" ? "#16a085" : "#1abc9c",
            }}
            onClick={() => handleToolSelect("scale")}
          >
            <FaArrowsLeftRight />
          </button>
        </div>
        <button style={styles.createButton} onClick={handleCreateModel}>
          <FaPlus /> Create Model
        </button>
      </div>
    </>
  );
};

const styles = {
  sidebar: {
    width: "240px",
    background: "#2c3e50",
    color: "#ecf0f1",
    padding: "10px",
    display: "flex",
    flexDirection: "column" as "column", // Ensure correct flex direction
  },
  toolbar: {
    background: "#2c3e50",
    color: "#ecf0f1",
    display: "flex",
    flexDirection: "column" as "column",
    padding: "10px",
    width: "240px",
  },
  toolButtons: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  toolButton: {
    background: "#1abc9c",
    color: "#ecf0f1",
    border: "none",
    padding: "10px",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background 0.3s",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "30%",
  },
  createButton: {
    background: "#1abc9c",
    color: "#ecf0f1",
    border: "none",
    padding: "10px",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background 0.3s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  modelList: {
    listStyleType: "none",
    padding: 0,
  },
  modelItem: {
    padding: "8px",
    cursor: "pointer",
    marginBottom: "5px",
    borderRadius: "4px",
    transition: "background-color 0.3s",
  },
};

export default Sidebar;
