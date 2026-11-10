// Explicit presentation-only boundaries added by W1-W9. Behavior stays in tested modules.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../../src/shared/utils/normalizeDisplayText.ts'), 'utf8');
const normalizer = { exports: {} };
new Function('module', 'exports', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(normalizer, normalizer.exports);
module.exports = {
  '@/shared/utils/normalizeDisplayText': normalizer.exports,
  '@/shared/components/ui/FormSectionHeader': { FormSectionHeader: 'FormSectionHeader' },
  './family-tree/FamilyViewSkeleton': { FamilyViewSkeleton: 'FamilyViewSkeleton' },
  './family-tree/FamilyExperience.css': {},
  '@/features/my-life/components/memories/LibraryGallery': { AlbumCard: 'AlbumCard', PhotoCard: 'PhotoCard' },
  '@/features/my-life/components/memories/MemoryActions': { MemoryActions: 'MemoryActions' },
  '@/features/my-life/components/memories/MemorySkeleton': { MemorySkeleton: 'MemorySkeleton' },
  '@/features/my-life/components/memories/Memories.css': {},
  './LibraryTab.css': {},
};
