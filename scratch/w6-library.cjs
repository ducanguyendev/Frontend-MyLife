const fs=require('node:fs');
const edit=(p,fn)=>fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));
edit('src/features/admin/components/family-tree/LibraryTab.tsx',s=>{
 s=s.replace('Plus, Eye, Pencil, Trash2, Upload','ArrowLeft, Plus, Pencil, Trash2, Upload');
 s=s.replace('PageHeader, Loading, ErrorState','PageHeader, ErrorState');
 s=s.replace("import { LibraryImage } from './LibraryImage';", "import { AlbumCard, PhotoCard } from '@/features/my-life/components/memories/LibraryGallery';\nimport { MemoryActions } from '@/features/my-life/components/memories/MemoryActions';\nimport { MemorySkeleton } from '@/features/my-life/components/memories/MemorySkeleton';\nimport '@/features/my-life/components/memories/Memories.css';");
 const a=s.indexOf('    <div className="library-workspace'),b=s.indexOf('      {/* Lightbox Modal */}',a);
 if(a<0||b<0)throw Error('Library layout markers');
 const jsx=`    <div className="library-workspace memory-page memory-page--library">
      <PageHeader eyebrow={t('appShell.memories')} title={t('admin.library_title')} description={t('memories.libraryDescription')} actions={albums.length > 0 ? <>
        <Button variant={activeAlbum ? 'secondary' : 'primary'} leftIcon={<Plus size={16}/>} onClick={() => setAlbumDialog('create')}>{t('admin.library_ui.create_album')}</Button>
        <Button variant={activeAlbum ? 'primary' : 'secondary'} leftIcon={<Upload size={16}/>} disabled={isLoading} onClick={() => setUploadOpen(true)}>{t('admin.library_ui.upload')}</Button>
      </> : undefined}/>
      {isLoading ? <MemorySkeleton module="library"/> : error ? <ErrorState message={t(error)} action={<Button variant="secondary" onClick={refresh}>{t('admin.library_ui.retry')}</Button>}/> : <>
        {activeAlbum ? <section className="library-album-heading">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={15}/>} onClick={() => setSelectedAlbum('all')}>{t('admin.library_ui.all_albums')}</Button>
          <div className="library-album-heading__title"><div><p>{t('memories.selectedAlbum')}</p><h2>{activeAlbum.name}</h2>{activeAlbum.description && <p>{activeAlbum.description}</p>}</div>
            <MemoryActions label={t('memories.albumActions')} actions={[
              { label:t('admin.library_ui.edit_album'), icon:<Pencil size={14}/>, onClick:() => setAlbumDialog(activeAlbum) },
              { label:t('admin.library_ui.delete_album'), icon:<Trash2 size={14}/>, danger:true, onClick:() => requestDelete({kind:'album',id:activeAlbum.id,name:activeAlbum.name}) },
            ]}/>
          </div>
        </section> : albums.length > 0 && <section className="library-albums" aria-labelledby="library-albums-title"><div className="memory-section-title"><h2 id="library-albums-title">{t('memories.albums')}</h2><span>{albums.length}</span></div>
          <div className="library-album-grid">{albums.map(album => <AlbumCard key={album.id} album={album} photos={libraryPhotos} onSelect={() => setSelectedAlbum(album.id)} onEdit={() => setAlbumDialog(album)} onDelete={() => requestDelete({kind:'album',id:album.id,name:album.name})}/>)}</div>
        </section>}
        {albums.length > 0 && <div className="memory-section-title library-photo-heading"><h2>{t('memories.photographs')}<span>{filteredPhotos.length}</span></h2>
          <Select aria-label={t('admin.library_ui.album_filter')} containerClassName="library-album-filter" appearance="simple" variant="compact" value={String(selectedAlbum)} onValueChange={value => setSelectedAlbum(value === 'all' ? 'all' : Number(value))}>
            <SelectItem value="all">{t('admin.library_ui.all_albums')}</SelectItem>{albums.map(album => <SelectItem key={album.id} value={String(album.id)}>{album.name}</SelectItem>)}
          </Select>
        </div>}
        <section className="library-gallery" aria-label={t('memories.photographs')}>
          {filteredPhotos.length === 0 ? <EmptyState title={t(albums.length === 0 ? 'admin.library_ui.no_albums' : activeAlbum?.photoCount === 0 || libraryPhotos.length === 0 ? 'admin.library_ui.no_album_photos' : 'admin.library_ui.no_matches')} description={t(albums.length === 0 ? 'memories.emptyLibraryDescription' : 'memories.emptyAlbumDescription')} action={albums.length === 0 ? <Button leftIcon={<Plus size={16}/>} onClick={() => setAlbumDialog('create')}>{t('admin.library_ui.create_album')}</Button> : undefined}/> : <div className="library-photo-grid">
            {filteredPhotos.map(photo => <PhotoCard key={photo.id} photo={photo} onView={() => setPreviewPhoto(photo)} onEdit={() => setEditingPhoto(photo)} onDelete={() => requestDelete({kind:'photo',id:photo.id,name:photo.title})}/>)}
          </div>}
        </section>
      </>}
`;
 s=s.slice(0,a)+jsx+s.slice(b);
 s=s.replace('<PhotoLightboxModal key={previewPhoto.id}', '<PhotoLightboxModal photos={filteredPhotos} onNavigate={setPreviewPhoto}');
 return s;
});
edit('src/features/admin/components/family-tree/LibraryUploadModal.tsx',s=>{
 s=s.replace("import { X }", "import { UploadCloud, X }");
 s=s.replace('maxWidth="lg"','maxWidth="full" className="memory-form memory-form--library"');
 s=s.replace('className="space-y-4">','id="libraryUploadForm" className="library-upload-form">');
 s=s.replace('      <LibrarySelectField','      <div className="memory-form-column"><LibrarySelectField');
 const start=s.indexOf('      <label className="block text-sm text-secondary-text">');const end=s.indexOf('      {previews.length',start);
 if(start<0||end<0)throw Error('Upload zone');
 s=s.slice(0,start)+`      <label className="library-upload-zone" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (isUploading) return; setFiles(Array.from(event.dataTransfer.files)); setError(null); }}>
        <UploadCloud size={30} strokeWidth={1.4}/><strong>{t('memories.dropPhotos')}</strong><span>{t('memories.choosePhotos')}</span><small>{t('admin.library_ui.upload_hint')}</small>
        <input ref={input} className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" disabled={isUploading}
          onChange={e => { setFiles(Array.from(e.target.files ?? [])); setError(null); e.target.value = ''; }}/>
      </label>
`+s.slice(end);
 s=s.replace('      <LibraryPhotoFormFields value={metadata} onChange={setMetadata} disabled={isUploading} />','      </div><div className="memory-form-column"><h2 className="memory-form__heading">{t(\'memories.photoDetails\')}</h2><LibraryPhotoFormFields value={metadata} onChange={setMetadata} disabled={isUploading}/></div>');
 s=s.replace('      {error &&','      {isUploading && <p className="memory-upload-status" role="status">{t(\'memories.uploadingPhotos\', { count:files.length })}</p>}\n      {error &&');
 s=s.replace('className="flex justify-end gap-3 pt-2"','className="memory-form__footer"');
 // The shared field class is no longer used for the visually hidden file input.
 s=s.replace('libraryDisplayDateError, libraryFieldClass,','libraryDisplayDateError,');
 return s;
});
