# Vertex, Line, and Face Editing Capabilities

## Overview

SaifEngine now includes comprehensive sub-object editing capabilities that allow you to modify 3D models at the vertex, edge (line), and face level. This feature provides precise control over mesh geometry for detailed modeling and design work.

## Features

### Vertex Editing
- **Selection**: Click individual vertices or use selection modes (single, multiple, box)
- **Movement**: Translate selected vertices in 3D space
- **Snapping**: Snap vertices to grid with adjustable precision
- **Deletion**: Remove selected vertices and automatically clean up affected geometry
- **Transform**: Apply precise coordinate-based transformations

### Edge Editing
- **Selection**: Select individual edges or multiple edges
- **Bevel**: Create smooth transitions by beveling selected edges
- **Split**: Divide edges into multiple segments
- **Loop Selection**: Select edge loops and rings for efficient workflow
- **Deletion**: Remove edges while maintaining mesh integrity

### Face Editing
- **Selection**: Select individual faces or groups of faces
- **Extrude**: Pull faces outward to create new geometry
- **Inset**: Create inward-facing borders on selected faces
- **Subdivide**: Add more geometry detail to selected faces
- **Flip Normals**: Reverse face orientation for lighting and rendering
- **Merge/Separate**: Combine or split face groups
- **Material Assignment**: Apply different materials to selected faces

## User Interface

### Mode Switching
Access sub-object editing through the Model Editor tabs:
- **Vertex Tab**: Enter vertex editing mode
- **Edge Tab**: Enter edge editing mode  
- **Face Tab**: Enter face editing mode

### Selection Modes
- **Single**: Select one element at a time
- **Multiple**: Add elements to selection (Shift+click)
- **Box**: Drag to select multiple elements in a region
- **Lasso**: Draw a selection area (coming soon)

### Visual Feedback
- **Selected vertices**: Highlighted in red
- **Selected edges**: Highlighted in green
- **Selected faces**: Highlighted with blue wireframe and semi-transparent overlay
- **Hover feedback**: Elements highlight on mouse-over

## Keyboard Shortcuts

### Mode Switching
- `1`: Switch to vertex editing mode
- `2`: Switch to edge editing mode
- `3`: Switch to face editing mode

### Selection
- `Ctrl+A`: Select all elements in current mode
- `Alt+A`: Deselect all elements
- `Ctrl+I`: Invert current selection
- `Shift+Click`: Add to selection
- `Ctrl+Click`: Remove from selection

### Operations
- `E`: Extrude selected faces
- `I`: Inset selected faces
- `Ctrl+B`: Bevel selected edges
- `M`: Merge selected vertices
- `X` or `Delete`: Delete selected elements

## Technical Implementation

### Data Structure
The system uses efficient data structures to represent mesh elements:
- **Vertices**: Position, normal, UV coordinates, selection state
- **Edges**: Vertex indices, selection state
- **Faces**: Vertex arrays, face normal, selection state

### Real-time Updates
- Geometry modifications are applied in real-time
- Visual feedback updates immediately on selection changes
- Undo/redo system preserves editing history

### Performance Optimization
- Selective rendering of helper geometries
- Efficient raycasting for element selection
- Batched operations for multiple element modifications

## Usage Examples

### Creating a Window in a Wall Face
1. Switch to face editing mode (`3`)
2. Select the wall face
3. Use Inset (`I`) to create a border
4. Select the inner inset face
5. Use Extrude (`E`) to create window depth

### Adding Detail to a Corner
1. Switch to edge editing mode (`2`)
2. Select corner edges
3. Use Bevel (`Ctrl+B`) to create smooth corners
4. Adjust bevel distance and segments as needed

### Smoothing a Surface
1. Switch to vertex editing mode (`1`)
2. Select vertices that need smoothing
3. Use the transform controls to adjust positions
4. Apply grid snapping for precise alignment

## Advanced Features

### Procedural Operations
- Maintain operation history for non-destructive editing
- Parameter adjustment after operation completion
- Batch operations on multiple selected elements

### Selection Tools
- Edge loop and ring selection for topology-aware editing
- Similar face selection based on normal direction or material
- Connected component selection for linked geometry

### Material Workflow
- Per-face material assignment
- Material inheritance and propagation
- UV mapping preservation during geometry modifications

## Best Practices

### Modeling Workflow
1. Start with basic shapes using the primitive tools
2. Switch to face mode for major shape modifications
3. Use edge mode for adding detail and smooth transitions
4. Use vertex mode for final precision adjustments

### Performance Tips
- Work with lower subdivision levels during heavy editing
- Use selection sets to save and restore complex selections
- Take advantage of keyboard shortcuts for efficient workflow

### Quality Control
- Regularly check for degenerate faces after vertex editing
- Maintain proper topology flow when adding edge loops
- Verify normal directions after face modifications

## Troubleshooting

### Common Issues
- **Selection not working**: Ensure you're in the correct editing mode
- **Operations not applying**: Check that elements are properly selected
- **Visual artifacts**: May require mesh cleanup after extensive editing

### Performance Issues
- Large meshes may require subdivision for responsive editing
- Complex selections can be optimized using selection sets
- Consider working on isolated mesh components for better performance

## Future Enhancements

### Planned Features
- Subdivision surface modeling
- Advanced selection tools (lasso, paint selection)
- Mesh analysis and repair tools
- Custom tool creation and scripting
- Collaborative editing capabilities

### Integration
- Export modified meshes to popular 3D formats
- Import/export of selection sets and editing sessions
- Integration with external modeling tools
- Cloud-based mesh processing capabilities
