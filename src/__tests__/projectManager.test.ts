import { ProjectManager, ProjectData } from '../utils/projectManager';
import { ModelMetadata } from '../types';

const createTestModel = (overrides: Partial<ModelMetadata> = {}): ModelMetadata => ({
  id: `model_test_${Math.random().toString(36).slice(2, 8)}`,
  type: 'box',
  name: 'Test Box',
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
  material: { type: 'standard', color: '#ffffff', roughness: 0.5, metalness: 0.1 },
  parentId: null,
  visible: true,
  locked: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('ProjectManager', () => {
  describe('saveProject', () => {
    it('should save models to JSON', async () => {
      const models = [createTestModel({ id: 'model-1', name: 'Cube' })];
      const json = await ProjectManager.saveProject(
        models,
        {},
        {},
        { name: 'Test Project' }
      );

      const parsed = JSON.parse(json) as ProjectData;
      expect(parsed.name).toBe('Test Project');
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.scene.models).toHaveLength(1);
      expect(parsed.scene.models[0].name).toBe('Cube');
    });

    it('should include scene state', async () => {
      const sceneState = {
        camera: { position: [5, 10, 15], target: [0, 0, 0], zoom: 2 },
        lighting: {
          ambientIntensity: 0.8,
          directionalLight: { position: [1, 2, 3], intensity: 0.5, castShadow: true },
          pointLight: { position: [4, 5, 6], intensity: 1.5, castShadow: false },
        },
        environment: { showGrid: true, showWireframe: false, backgroundColor: '#000000' },
      };

      const json = await ProjectManager.saveProject([], {}, sceneState, { name: 'Test' });
      const parsed = JSON.parse(json) as ProjectData;

      expect(parsed.scene.camera.position).toEqual([5, 10, 15]);
      expect(parsed.scene.lighting.ambientIntensity).toBe(0.8);
      expect(parsed.scene.environment.backgroundColor).toBe('#000000');
    });

    it('should save node graph state when provided', async () => {
      const nodeGraph = {
        nodes: [
          { id: 'n1', type: 'input', position: { x: 0, y: 0 }, data: { value: 5 }, inputs: [], outputs: ['value'] },
        ],
        connections: [
          { id: 'c1', sourceNodeId: 'n1', targetNodeId: 'n2', sourcePort: 'value', targetPort: 'input' },
        ],
      };

      const json = await ProjectManager.saveProject([], {}, {}, { name: 'Test' }, {}, nodeGraph);
      const parsed = JSON.parse(json) as ProjectData;

      expect(parsed.nodeGraph).toBeDefined();
      expect(parsed.nodeGraph!.nodes).toHaveLength(1);
      expect(parsed.nodeGraph!.connections).toHaveLength(1);
    });

    it('should not include node graph when not provided', async () => {
      const json = await ProjectManager.saveProject([], {}, {}, { name: 'Test' });
      const parsed = JSON.parse(json) as ProjectData;

      expect(parsed.nodeGraph).toBeUndefined();
    });

    it('should include metadata', async () => {
      const json = await ProjectManager.saveProject(
        [],
        {},
        {},
        { name: 'My Project', description: 'A test', author: 'Tester' }
      );
      const parsed = JSON.parse(json) as ProjectData;

      expect(parsed.metadata.description).toBe('A test');
      expect(parsed.metadata.author).toBe('Tester');
    });
  });

  describe('loadProjectFromJSON', () => {
    it('should load a valid project', async () => {
      const models = [createTestModel({ id: 'model-1' })];
      const json = await ProjectManager.saveProject(models, {}, {}, { name: 'Test' });

      const result = ProjectManager.loadProjectFromJSON(json);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.scene.models).toHaveLength(1);
    });

    it('should fail on invalid JSON', () => {
      const result = ProjectManager.loadProjectFromJSON('not valid json');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail when scene is missing', () => {
      const result = ProjectManager.loadProjectFromJSON(JSON.stringify({ version: '1.0.0' }));
      expect(result.success).toBe(false);
      expect(result.error).toContain('missing scene data');
    });

    it('should fail when models array is missing', () => {
      const result = ProjectManager.loadProjectFromJSON(
        JSON.stringify({ version: '1.0.0', scene: {} })
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('missing or invalid models data');
    });

    it('should warn about missing version', () => {
      const result = ProjectManager.loadProjectFromJSON(
        JSON.stringify({ scene: { models: [] } })
      );
      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some(w => w.includes('version'))).toBe(true);
    });

    it('should warn about version mismatch', () => {
      const result = ProjectManager.loadProjectFromJSON(
        JSON.stringify({ version: '0.5.0', scene: { models: [] } })
      );
      expect(result.success).toBe(true);
      expect(result.warnings!.some(w => w.includes('version'))).toBe(true);
    });

    it('should fix models missing IDs', () => {
      const result = ProjectManager.loadProjectFromJSON(
        JSON.stringify({
          version: '1.0.0',
          scene: { models: [{ type: 'box', material: { type: 'standard' } }] },
        })
      );
      expect(result.success).toBe(true);
      expect(result.data!.scene.models[0].id).toBeTruthy();
      expect(result.warnings!.some(w => w.includes('missing ID'))).toBe(true);
    });

    it('should preserve node graph data in loaded project', async () => {
      const nodeGraph = {
        nodes: [{ id: 'n1', type: 'math', position: { x: 0, y: 0 }, data: {}, inputs: [], outputs: [] }],
        connections: [],
      };

      const json = await ProjectManager.saveProject([], {}, {}, { name: 'Test' }, {}, nodeGraph);
      const result = ProjectManager.loadProjectFromJSON(json);

      expect(result.success).toBe(true);
      expect(result.data!.nodeGraph).toBeDefined();
      expect(result.data!.nodeGraph!.nodes).toHaveLength(1);
    });
  });

  describe('validateProjectFile', () => {
    it('should accept valid .esp files', () => {
      const file = new File(['{}'], 'test.esp', { type: 'application/json' });
      const result = ProjectManager.validateProjectFile(file);
      expect(result.valid).toBe(true);
    });

    it('should reject non-.esp files', () => {
      const file = new File(['{}'], 'test.json', { type: 'application/json' });
      const result = ProjectManager.validateProjectFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('.esp');
    });

    it('should reject empty files', () => {
      const file = new File([], 'test.esp', { type: 'application/json' });
      const result = ProjectManager.validateProjectFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });
  });
});
