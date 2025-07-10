# SaifEngine - Comprehensive Mesh Editing Guide

## Overview
SaifEngine now features advanced mesh editing capabilities inspired by professional 3D software like Blender. Users can modify 3D models at the vertex, edge, and face level with precision and control.

## Getting Started

### Entering Mesh Edit Mode
1. **Select a model** in the 3D viewport
2. **Switch edit modes** using these methods:
   - **Toolbar buttons**: Click vertex/edge/face icons
   - **Keyboard shortcuts**: Press `1` (vertex), `2` (edge), or `3` (face)
   - **Tab cycling**: Press `Tab` to cycle through modes

## Edit Modes

### Vertex Mode (Key: `1`)
Edit individual vertices of the mesh.
- **Select vertices** by clicking
- **Move, rotate, scale** selected vertices
- **Merge vertices** together
- **Delete** unwanted vertices

### Edge Mode (Key: `2`)
Edit edges (lines between vertices).
- **Select edges** by clicking
- **Bevel edges** for rounded corners
- **Split edges** to add detail
- **Loop cuts** for adding edge loops
- **Delete** edges

### Face Mode (Key: `3`)
Edit faces (polygonal surfaces).
- **Select faces** by clicking
- **Extrude faces** to create new geometry
- **Inset faces** for detailed modeling
- **Subdivide faces** to add resolution
- **Delete** faces

## Selection Methods

### Basic Selection
- **Single click**: Select one element
- **Shift + click**: Add to selection
- **Ctrl/Cmd + click**: Toggle selection
- **Alt + click**: Remove from selection

### Advanced Selection
- **Box selection**: Click and drag to select multiple elements
- **Select all**: Press `A` key
- **Deselect all**: Press `Shift + A` or `Alt + A`
- **Grow selection**: Press `Ctrl + =` (expand selection to adjacent elements)
- **Shrink selection**: Press `Ctrl + -` (contract selection)

## Transform Tools

### Switching Transform Tools
- **Translate (Move)**: Press `G` key
- **Rotate**: Press `R` key
- **Scale**: Press `S` key

### Using Transform Gizmos
When elements are selected, interactive gizmos appear:
- **Red arrow/ring**: X-axis constraint
- **Green arrow/ring**: Y-axis constraint
- **Blue arrow/ring**: Z-axis constraint
- **White center**: Free transform

### Transform Constraints
During transform operations:
- **X key**: Constrain to X-axis
- **Y key**: Constrain to Y-axis
- **Z key**: Constrain to Z-axis

## Mesh Operations

### Face Operations

#### Extrude (Key: `E`)
Creates new geometry by extending selected faces.
- **Distance**: How far to extrude
- **Individual faces**: Extrude each face separately
- **Direction**: Custom extrude direction (optional)

#### Inset (Key: `I`)
Creates an inset (smaller face) within selected faces.
- **Distance**: How far to inset
- **Depth**: Additional depth offset
- **Individual faces**: Inset each face separately

#### Subdivide (Key: `W`)
Adds more geometry by splitting faces.
- **Cuts**: Number of subdivision levels
- **Smoothness**: How much to smooth the result

### Edge Operations

#### Bevel (Key: `Ctrl + B`)
Creates rounded edges by cutting corners.
- **Distance**: Size of the bevel
- **Segments**: Number of bevel segments
- **Profile**: Shape of the bevel curve

#### Split Edges
Divides edges into multiple segments.
- **Splits**: Number of divisions per edge

#### Loop Cut (Key: `Ctrl + R`)
Creates edge loops across connected geometry.
- **Cuts**: Number of parallel cuts
- **Smoothness**: Edge flow smoothing

### Vertex Operations

#### Merge (Key: `Alt + M`)
Combines multiple vertices into one.
- **At Center**: Merge to calculated center
- **At First**: Merge to first selected vertex
- **At Last**: Merge to last selected vertex
- **At Cursor**: Merge to 3D cursor position

### General Operations

#### Delete (Key: `X` or `Delete`)
Removes selected elements from the mesh.
- Deleting vertices removes connected edges and faces
- Deleting edges removes connected faces
- Deleting faces removes only the selected faces

## Keyboard Shortcuts Reference

### Mode Switching
- `1` - Vertex mode
- `2` - Edge mode  
- `3` - Face mode
- `Tab` - Cycle through modes

### Tool Switching
- `G` - Grab/Move tool
- `R` - Rotate tool
- `S` - Scale tool

### Selection
- `A` - Select all
- `Shift + A` - Deselect all
- `Alt + A` - Deselect all (alternative)
- `Ctrl + =` - Grow selection
- `Ctrl + -` - Shrink selection

### Face Operations
- `E` - Extrude faces
- `I` - Inset faces
- `W` - Subdivide faces

### Edge Operations
- `Ctrl + B` - Bevel edges
- `Ctrl + R` - Loop cut

### Vertex Operations
- `Alt + M` - Merge vertices

### General
- `X` or `Delete` - Delete selected
- `Ctrl + Z` - Undo (if implemented)
- `Ctrl + Y` - Redo (if implemented)

## Mesh Operations Panel

The operations panel provides precise control over mesh editing:

### Transform Section
- **Move**: Precise coordinate input for movement
- **Scale**: Per-axis scaling values
- **Rotate**: Rotation in degrees
- **Constraints**: Lock to specific axes or planes
- **Custom Pivot**: Set custom pivot point for transforms

### Face Operations Section
- **Extrude**: Distance and direction controls
- **Inset**: Distance and depth settings
- **Subdivide**: Cut count and smoothness sliders

### Edge Operations Section
- **Bevel**: Distance, segments, and profile controls
- **Split**: Number of splits per edge
- **Loop Cut**: Cut count and smoothness

### Vertex Operations Section
- **Merge**: Type selection for merge operation

## Tips and Best Practices

### Modeling Workflow
1. **Start simple**: Begin with basic shapes and add detail progressively
2. **Use subdivision**: Add geometry only where needed
3. **Maintain topology**: Keep clean edge flow for better results
4. **Save frequently**: Complex operations can be undone more easily

### Selection Tips
- **Use box selection** for selecting multiple elements quickly
- **Grow/shrink selection** to refine selections easily
- **Alt-click edges** to select edge loops automatically
- **Double-click faces** to select connected faces

### Transform Tips
- **Use constraints** (`X`, `Y`, `Z` keys) for precise movement
- **Set custom pivot points** for complex rotations
- **Use snap-to-grid** for alignment
- **Combine tools**: Scale then move for complex adjustments

### Performance Notes
- **High-poly models** may slow down real-time editing
- **Undo operations** are recommended for complex changes
- **Backup models** before major modifications

## Troubleshooting

### Common Issues
- **Selection not working**: Ensure you're in the correct edit mode
- **Gizmo not appearing**: Check that elements are selected
- **Operations not applying**: Verify elements are selected and parameters are valid
- **Mesh corruption**: Use mesh validation tools to check integrity

### Recovery
- **Undo operations**: Use Ctrl+Z to revert changes
- **Reload model**: Re-import the original model if needed
- **Mesh validation**: Check for and fix topology issues

## Future Enhancements

Planned improvements include:
- **Advanced selection tools** (loop select, ring select)
- **More mesh operations** (bridge, knife tool, proportional editing)
- **Mesh validation and repair** tools
- **Undo/redo system** with operation history
- **Custom tools and scripts** support
- **Multi-object editing** capabilities

## Support

For additional help or to report issues:
- Check the console for error messages
- Ensure all dependencies are properly installed
- Refer to the component documentation for technical details
