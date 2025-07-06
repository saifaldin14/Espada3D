import React, { useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { updateModelMaterial } from "../../store/slices/modelSlice";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
} from "@mui/material";
import {
  CloudUpload,
  Delete,
  Visibility,
  Image,
  Texture,
  Gradient,
} from "@mui/icons-material";
import { TextureProperties, MaterialProperties } from "../../types";

interface TextureManagerProps {
  selectedModelId: string | null;
  currentMaterial: MaterialProperties;
}

interface TextureAsset {
  id: string;
  name: string;
  type:
    | "diffuse"
    | "normal"
    | "roughness"
    | "metalness"
    | "environment"
    | "displacement";
  url: string;
  preview: string;
  size: number;
}

const TextureManager: React.FC<TextureManagerProps> = ({
  selectedModelId,
  currentMaterial,
}) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [textureAssets, setTextureAssets] = useState<TextureAsset[]>([]);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [selectedTextureType, setSelectedTextureType] =
    useState<TextureAsset["type"]>("diffuse");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const newTexture: TextureAsset = {
        id: `texture_${Date.now()}`,
        name: file.name,
        type: selectedTextureType,
        url: result,
        preview: result,
        size: file.size,
      };

      setTextureAssets([...textureAssets, newTexture]);
      setUploadDialog(false);

      // Auto-apply to selected model if applicable
      if (selectedModelId) {
        applyTexture(newTexture);
      }
    };
    reader.readAsDataURL(file);
  };

  const applyTexture = (texture: TextureAsset) => {
    if (!selectedModelId) return;

    const updatedTextures: TextureProperties = {
      ...currentMaterial.textures,
    };

    switch (texture.type) {
      case "diffuse":
        updatedTextures.map = texture.url;
        break;
      case "normal":
        updatedTextures.normalMap = texture.url;
        break;
      case "roughness":
        updatedTextures.roughnessMap = texture.url;
        break;
      case "metalness":
        updatedTextures.metalnessMap = texture.url;
        break;
      case "environment":
        updatedTextures.envMap = texture.url;
        break;
      case "displacement":
        updatedTextures.displacement = texture.url;
        break;
    }

    const updatedMaterial: MaterialProperties = {
      ...currentMaterial,
      textures: updatedTextures,
    };

    dispatch(
      updateModelMaterial({
        id: selectedModelId,
        material: updatedMaterial,
      })
    );
  };

  const removeTexture = (textureId: string) => {
    setTextureAssets(textureAssets.filter((t) => t.id !== textureId));
  };

  const clearTextureFromMaterial = (textureType: TextureAsset["type"]) => {
    if (!selectedModelId) return;

    const updatedTextures: TextureProperties = {
      ...currentMaterial.textures,
    };

    switch (textureType) {
      case "diffuse":
        delete updatedTextures.map;
        break;
      case "normal":
        delete updatedTextures.normalMap;
        break;
      case "roughness":
        delete updatedTextures.roughnessMap;
        break;
      case "metalness":
        delete updatedTextures.metalnessMap;
        break;
      case "environment":
        delete updatedTextures.envMap;
        break;
      case "displacement":
        delete updatedTextures.displacement;
        break;
    }

    const updatedMaterial: MaterialProperties = {
      ...currentMaterial,
      textures: updatedTextures,
    };

    dispatch(
      updateModelMaterial({
        id: selectedModelId,
        material: updatedMaterial,
      })
    );
  };

  const getTextureTypeColor = (type: TextureAsset["type"]) => {
    switch (type) {
      case "diffuse":
        return "primary";
      case "normal":
        return "secondary";
      case "roughness":
        return "warning";
      case "metalness":
        return "info";
      case "environment":
        return "success";
      case "displacement":
        return "error";
      default:
        return "default";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card sx={styles.card}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Texture Manager
        </Typography>

        {/* Applied Textures */}
        <Box sx={styles.section}>
          <Typography variant="subtitle2" gutterBottom>
            Applied Textures
          </Typography>
          <Grid container spacing={1}>
            {Object.entries(currentMaterial.textures || {}).map(
              ([key, value]) => (
                <Grid item xs={6} key={key}>
                  <Box sx={styles.appliedTexture}>
                    <img
                      src={value}
                      alt={key}
                      style={styles.texturePreview}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <Typography variant="caption" sx={styles.textureLabel}>
                      {key}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() =>
                        clearTextureFromMaterial(key as TextureAsset["type"])
                      }
                      sx={styles.removeButton}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Grid>
              )
            )}
          </Grid>
        </Box>

        {/* Texture Library */}
        <Box sx={styles.section}>
          <Box sx={styles.sectionHeader}>
            <Typography variant="subtitle2">
              Texture Library ({textureAssets.length})
            </Typography>
            <Button
              size="small"
              startIcon={<CloudUpload />}
              onClick={() => setUploadDialog(true)}
              variant="outlined"
            >
              Upload
            </Button>
          </Box>

          <List dense>
            {textureAssets.map((texture) => (
              <ListItem key={texture.id} disablePadding>
                <ListItemButton
                  onClick={() => applyTexture(texture)}
                  sx={styles.textureItem}
                >
                  <ListItemAvatar>
                    <Avatar src={texture.preview} variant="rounded">
                      <Texture />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={texture.name}
                    secondary={
                      <Box sx={styles.textureInfo}>
                        <Chip
                          label={texture.type}
                          size="small"
                          color={getTextureTypeColor(texture.type) as any}
                        />
                        <Typography variant="caption" color="textSecondary">
                          {formatFileSize(texture.size)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItemButton>
                <IconButton
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    removeTexture(texture.id);
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </ListItem>
            ))}
            {textureAssets.length === 0 && (
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ textAlign: "center", py: 2 }}
              >
                No textures uploaded
              </Typography>
            )}
          </List>
        </Box>

        {/* Upload Dialog */}
        <Dialog
          open={uploadDialog}
          onClose={() => setUploadDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Upload Texture</DialogTitle>
          <DialogContent>
            <Typography variant="body2" gutterBottom>
              Select texture type:
            </Typography>
            <Grid container spacing={1} sx={{ mb: 2 }}>
              {(
                [
                  "diffuse",
                  "normal",
                  "roughness",
                  "metalness",
                  "environment",
                  "displacement",
                ] as const
              ).map((type) => (
                <Grid item key={type}>
                  <Button
                    variant={
                      selectedTextureType === type ? "contained" : "outlined"
                    }
                    size="small"
                    onClick={() => setSelectedTextureType(type)}
                  >
                    {type}
                  </Button>
                </Grid>
              ))}
            </Grid>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<CloudUpload />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ height: 100, borderStyle: "dashed" }}
            >
              Click to upload or drag & drop
              <br />
              Supported: JPG, PNG, WEBP
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

const styles = {
  card: {
    marginBottom: "16px",
  },
  section: {
    marginBottom: "16px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  appliedTexture: {
    position: "relative" as const,
    aspectRatio: "1",
    border: "1px solid #ddd",
    borderRadius: "8px",
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
  },
  texturePreview: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  textureLabel: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    color: "white",
    padding: "2px 4px",
    textAlign: "center" as const,
  },
  removeButton: {
    position: "absolute" as const,
    top: 2,
    right: 2,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  textureItem: {
    borderRadius: "8px",
    marginBottom: "4px",
    "&:hover": {
      backgroundColor: "rgba(0,0,0,0.04)",
    },
  },
  textureInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
};

export default TextureManager;
