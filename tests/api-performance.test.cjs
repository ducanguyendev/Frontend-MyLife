const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const library = read('src/features/admin/components/family-tree/LibraryTab.tsx');
const libraryService = read('src/features/admin/services/libraryService.ts');
const anniversaries = read('src/features/admin/components/family-tree/AnniversaryTab.tsx');
const anniversariesPage = read('src/features/my-life/pages/AnniversariesPage.tsx');
const familyMembers = read('src/features/admin/components/family-tree/useFamilyMembers.ts');

test('Library overview is the single metadata load and album filtering stays client-side', () => {
  assert.match(libraryService, /getOverview: \(signal\?: AbortSignal\) => apiClient\.get<LibraryOverview>\('\/api\/library\/overview', \{ signal \}\)/);
  assert.match(library, /const overview = await libraryService\.getOverview\(controller\.signal\)/);
  assert.match(library, /\}, \[refreshKey\]\)/);
  assert.doesNotMatch(library, /libraryService\.(getAlbums|getCategories|getAlbum)\(/);
  assert.doesNotMatch(library, /Promise\.all\(wanted|wanted\.map/);
  assert.match(library, /overview\.albums\.flatMap/);
  assert.match(library, /selectedAlbum === 'all' \|\| photo\.albumId === selectedAlbum/);
  assert.doesNotMatch(library, /category|categories/i);
  assert.match(library, /setSelectedAlbum\(current => current === 'all' \|\| overview\.albums\.some/);
  assert.match(library, /setPreviewPhoto\(previous => previous \? photos\.find\(photo => photo\.id === previous\.id\) \?\? null : null\)/);
});

test('Anniversaries page renders without eager FamilyTree loading', () => {
  assert.doesNotMatch(anniversariesPage, /useFamilyMembers|fetchFamilyMembers|membersLoading/);
  assert.match(anniversariesPage, /<AnniversaryTab showToast=\{showToast\} \/>/);
  assert.match(anniversaries, /anniversaryService\.getAnniversaries\(signal\)/);
});

test('Anniversary Add/Edit share one abortable member request and subsequent opens reuse cache', () => {
  assert.match(familyMembers, /export async function fetchFamilyMembers/);
  assert.match(familyMembers, /apiClient\.requestRaw\('\/api\/family-tree', \{ signal \}\)/);
  assert.match(anniversaries, /import \{ fetchFamilyMembers \} from '\.\/useFamilyMembers'/);
  assert.match(anniversaries, /membersRequest = useRef<Promise<FamilyMember\[\] \| null> \| null>/);
  assert.match(anniversaries, /if \(!request\)/);
  assert.match(anniversaries, /if \(members !== null\)/);
  assert.match(anniversaries, /membersController\.current\?\.abort\(\)/);
  assert.match(anniversaries, /onClick=\{\(\) => void openEditor\(item\)\}/);
  assert.match(anniversaries, /onClick=\{\(\) => void openEditor\(null\)\}/);
  assert.match(anniversaries, /if \(loaded !== null && !membersController\.current\?\.signal\.aborted\)/);
  assert.match(anniversaries, /editing !== undefined && members !== null/);
  assert.match(anniversaries, /onClick=\{\(\) => void confirmDelete\(\)\}/);
  assert.doesNotMatch(anniversaries, /const (search|moveMonth|selectDay|clearDateFilter)[\s\S]{0,220}fetchFamilyMembers/);
});
