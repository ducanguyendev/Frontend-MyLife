const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const baseline = path.join(root, 'scratch/w5-baseline');
function edit(file, fn) {
  const full = path.join(root, file), source = fs.readFileSync(full, 'utf8');
  const copy = path.join(baseline, file); fs.mkdirSync(path.dirname(copy), { recursive:true });
  if (!fs.existsSync(copy)) fs.writeFileSync(copy, source);
  const result = fn(source); if (result === source) throw Error('No change: '+file);
  fs.writeFileSync(full, result);
}
edit('src/shared/layouts/app-shell/AppShell.tsx', s => s
 .replace("contentClassName = '' }: {", "contentClassName = '', breadcrumbName }: {")
 .replace("contentClassName?: string;", "contentClassName?: string; breadcrumbName?: string;")
 .replace(/  const entries = .*?  const openProfile/s, "  const isMemberRoute = pathname.startsWith('/mylife/family/member/');\n  const isMemoriesRoute = memories.some(item => pathname === item.to || pathname.startsWith(item.to + '/'));\n  const openProfile")
 .replace('<p className="app-nav__caption">{t(\'appShell.memories\')}</p>', '<p className={`app-nav__caption ${isMemoriesRoute ? \'is-current\' : \'\'}`}>{t(\'appShell.memories\')}</p>')
 .replace('<div className="app-shell__breadcrumb"><span>MyLife</span><ChevronRight size={13} aria-hidden="true"/><strong>{context}</strong></div>', '<>{isMemberRoute && <nav className="app-shell__breadcrumb" aria-label={t(\'family.breadcrumb\')}><Link to="/familytree">{t(\'appShell.family\')}</Link><ChevronRight size={13} aria-hidden="true"/><Link to="/familytree">{t(\'family.members\')}</Link><ChevronRight size={13} aria-hidden="true"/><strong aria-current="page">{breadcrumbName || t(\'appShell.member\')}</strong></nav>}</>'));
edit('src/shared/layouts/MyLifeWorkspaceLayout.tsx', s => s.replace("  backTo: string;", "  backTo: string;\n  breadcrumbName?: string;").replace("  children,", "  children, breadcrumbName,").replace('<AppShell contentScroll=', '<AppShell breadcrumbName={breadcrumbName} contentScroll='));
edit('src/features/auth/components/UserMenu.tsx', s => s.replace("t('landing.publicHome')", "t('family.publicLanding')"));
edit('src/features/family-tree/pages/FamilyTreePage.tsx', s => s.replace('className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-custom-border bg-[var(--surface-page)]"', 'className="flex min-h-0 flex-1 flex-col overflow-hidden"'));
edit('src/features/admin/components/FamilyTreeManager.tsx', s => s
 .replace('PageHeader, Badge, SegmentedControl, Loading,', 'PageHeader, SegmentedControl,')
 .replace('import { SearchBar }', 'import { FamilyViewSkeleton } from \'./family-tree/FamilyViewSkeleton\';\nimport \'./family-tree/FamilyExperience.css\';\nimport { SearchBar }')
 .replace('family-manager flex h-full min-h-0 flex-col overflow-hidden bg-[var(--surface-page)]', 'family-manager flex h-full min-h-0 flex-col overflow-hidden')
 .replace('className="px-4 pt-5 sm:px-6"', 'className="family-manager__header"')
 .replace("badge={<Badge variant=\"accent\">{t('admin.my_family_tree')}</Badge>}", "eyebrow={t('family.roots')}")
 .replace("actions={<Button", "actions={members.length > 0 || loading || loadError ? <Button")
 .replace("{t('admin.add_member')}</Button>}/>", "{t('admin.add_member')}</Button> : undefined}/>")
 .replace('className="flex shrink-0 flex-col gap-3 px-4 pb-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between"', 'className="family-toolbar"')
 .replace('className="w-full lg:w-80"', 'className="family-toolbar__search"\n              clearLabel={t(\'family.clearSearch\')}')
 .replace('className="flex flex-wrap items-center gap-3"', 'className="family-toolbar__filters"')
 .replace('onChange={setViewMode} iconOnly', 'onChange={setViewMode}')
 .replace("label: t('admin.view_mindmap')", "label: t('family.viewTree')").replace("label: t('admin.view_grid')", "label: t('family.viewCards')").replace("label: t('admin.view_table')", "label: t('family.viewList')")
 .replace('overscroll-contain px-3 pb-3 sm:px-4 sm:pb-4 custom-scrollbar', 'overscroll-contain custom-scrollbar')
 .replace(/<Loading label=\{t\('admin.library_ui.loading'\)\}\/?>/g, '<FamilyViewSkeleton view={viewMode}/>')
 .replace('<Loading label={t("admin.library_ui.loading")}/>', '<FamilyViewSkeleton view="mindmap"/>')
 .replace("title={t('admin.tree_empty')} description={t('admin.tree_empty_hint')}", "title={t('family.emptyTitle')} description={t('family.emptyDescription')}")
 .replace('className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"', 'className="family-gallery"'));
edit('src/shared/components/SearchBar.tsx', s => s.replace("import React from 'react';", "import React, { useRef } from 'react';\nimport { X } from 'lucide-react';").replace('  value: string;', '  clearLabel?: string;\n  value: string;').replace('  value,', '  value, clearLabel,').replace('}) => (', '}) => {\n  const inputRef = useRef<HTMLInputElement>(null);\n  return (').replace('      id={id}', '      ref={inputRef}\n      rightIcon={value && clearLabel ? <button type="button" disabled={disabled} aria-label={clearLabel} title={clearLabel} className="family-search-clear" onClick={() => { onChange(\'\'); inputRef.current?.focus(); }}><X size={16}/></button> : undefined}\n      id={id}').replace(/\);\s*$/, ');\n};\n'));
// The accordion sections remain collapsible, with all fields visible on opening.
edit('src/features/admin/components/family-tree/MemberFormModal.tsx', s => s.replace('useState<string[]>(["bio"])', 'useState<string[]>(["basic", "relations", "contact", "bio"])').replace('maxWidth="2xl"', 'maxWidth="full"\n      className="family-member-form"').replace('showTitle={false}', 'title={t(isUpdate ? "admin.edit_member" : "admin.add_new_member")}').replace('className="space-y-4">', 'className="family-form-grid">').replace(/className="border border-custom-border\/70 rounded-xl bg-secondary-bg\/30 overflow-hidden transition-all"/g, 'className="family-form-section"').replace('text-sm text-error"><Trash2', 'text-sm text-secondary-text hover:text-error"><Trash2'));
edit('src/features/admin/components/family-tree/MemberDetailModal.tsx', s => s.replace('className="!max-h-[calc(100vh-24px)] sm:!max-h-[calc(100vh-40px)]"', 'className="family-quick-detail !max-h-[calc(100vh-24px)] sm:!max-h-[calc(100vh-40px)]"').replace('<span className="max-w-full truncate text-xs', '<MemberAvatarImage member={related} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" /><span className="max-w-full truncate text-xs').replace('onClick={() => onOpenProfile(member)} className=', 'onClick={() => onOpenProfile(member)} aria-label={t(\'admin.family_v2.view_profile\')} className='));
const translations = {
 vi: { roots:'CÃ¹ng má»™t gá»‘c rá»…', breadcrumb:'ÄÆ°á»ng dáº«n', members:'ThÃ nh viÃªn', publicLanding:'Trang giá»›i thiá»‡u MyLife', clearSearch:'XÃ³a tÃ¬m kiáº¿m', viewTree:'CÃ¢y', viewCards:'Tháº»', viewList:'Danh sÃ¡ch', emptyTitle:'Gia Ä‘Ã¬nh cá»§a báº¡n báº¯t Ä‘áº§u tá»« má»™t ngÆ°á»i.', emptyDescription:'ThÃªm thÃ nh viÃªn Ä‘áº§u tiÃªn Ä‘á»ƒ báº¯t Ä‘áº§u xÃ¢y dá»±ng cÃ¢u chuyá»‡n gia Ä‘Ã¬nh.', loading:'Äang táº£i gia Ä‘Ã¬nh', contact:'LiÃªn há»‡', openMap:'Má»Ÿ báº£n Ä‘á»“', openLibrary:'Má»Ÿ thÆ° viá»‡n', openTimeline:'Xem dÃ²ng thá»i gian', exploreHint:'KhÃ¡m phÃ¡ nhá»¯ng káº¿t ná»‘i giá»¯a hai thÃ nh viÃªn trong gia Ä‘Ã¬nh.', archive:'Há»“ sÆ¡ gia Ä‘Ã¬nh', results:'Káº¿t quáº£ tá»« há»“ sÆ¡ gia Ä‘Ã¬nh' },
 en: { roots:'From the same roots', breadcrumb:'Breadcrumb', members:'Members', publicLanding:'About MyLife', clearSearch:'Clear search', viewTree:'Tree', viewCards:'Cards', viewList:'List', emptyTitle:'Your family starts with one person.', emptyDescription:'Add your first member to begin building your family story.', loading:'Loading your family', contact:'Contact', openMap:'Open map', openLibrary:'Open library', openTimeline:'View timeline', exploreHint:'Discover the connections between two people in your family.', archive:'Family portrait', results:'From your family archive' }
};
for (const lang of ['vi','en']) edit(`src/shared/locales/${lang}/common.json`, s => { const data = JSON.parse(s); data.family = translations[lang]; return JSON.stringify(data,null,2)+'\n'; });

