import React from 'react';

export interface ScreenImageItem {
  src: string;
  alt: string;
  maxWidthClass?: string;
}

interface ScreenPreviewBlockProps {
  tag: string;
  title: string;
  desc: string;
  desc2?: string;
  images: ScreenImageItem[];
  reverse?: boolean;
}

export const ScreenPreviewBlock: React.FC<ScreenPreviewBlockProps> = ({
  tag,
  title,
  desc,
  desc2,
  images,
  reverse = false,
}) => {
  const textColumn = (
    <div className={`lg:col-span-5 flex flex-col gap-3 ${reverse ? 'order-1 lg:order-2' : ''}`}>
      <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
        {tag}
      </span>
      <h4 className="text-xl font-bold text-[#111111]">
        {title}
      </h4>
      <p className="text-gray-600 text-sm font-light leading-relaxed">
        {desc}
      </p>
      {desc2 && (
        <p className="text-gray-600 text-sm font-light leading-relaxed">
          {desc2}
        </p>
      )}
    </div>
  );

  const imagesColumn = (
    <div className={`lg:col-span-7 ${reverse ? 'order-2 lg:order-1' : ''} ${images.length > 1 ? 'flex flex-col gap-4' : ''}`}>
      {images.map((img, idx) => (
        <div 
          key={idx} 
          className={`w-full ${img.maxWidthClass || ''} bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden flex flex-col`}
        >
          <div className="bg-white border-b border-gray-200 px-3 py-2.5 flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500/70" />
            <span className="w-2 h-2 rounded-full bg-yellow-500/70" />
            <span className="w-2 h-2 rounded-full bg-green-500/70" />
          </div>
          <img src={img.src} alt={img.alt} className="w-full h-auto object-contain" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      {reverse ? (
        <>
          {imagesColumn}
          {textColumn}
        </>
      ) : (
        <>
          {textColumn}
          {imagesColumn}
        </>
      )}
    </div>
  );
};
