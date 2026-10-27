import React from 'react';
import { BookOpen, CalendarDays, Flower2, MapPinned } from 'lucide-react';

export const FamilyHeroArtwork: React.FC = () => (
  <svg className="my-life-hero__svg" viewBox="0 0 520 330" fill="none">
    <path className="my-life-hero__arch" d="M63 287V141C63 68 122 22 260 22s197 46 197 119v146" />
    <path className="my-life-hero__branch" d="M97 102c17-28 38-40 66-43m260 43c-17-28-38-40-66-43M112 83l-4-28m22 14 18-22m-35 43-27-5m300-2 4-28m-22 14-18-22m35 43 27-5" />
    <ellipse className="my-life-hero__ground" cx="260" cy="279" rx="196" ry="24" />

    <g className="my-life-hero__person my-life-hero__person--grandparent">
      <path className="person-body" d="M104 276c2-62 19-91 54-91s52 29 54 91H104Z" />
      <path className="person-neck" d="M146 166h25v30h-25z" />
      <circle className="person-face" cx="158" cy="145" r="34" />
      <path className="person-hair" d="M125 144c-3-37 20-53 42-49 27 5 34 27 25 45-9-4-16-14-18-25-11 16-28 26-49 29Z" />
      <path className="person-detail" d="M145 153h1m24 0h1m-18 17c5 4 11 4 16 0" />
    </g>
    <g className="my-life-hero__person my-life-hero__person--grandparent-two">
      <path className="person-body" d="M182 276c2-67 20-100 58-100s57 33 59 100H182Z" />
      <path className="person-neck" d="M225 151h27v32h-27z" />
      <circle className="person-face" cx="239" cy="132" r="37" />
      <path className="person-hair" d="M203 130c-2-37 20-57 43-56 30 1 42 25 31 51-13-7-21-18-24-29-10 16-27 27-50 34Z" />
      <path className="person-detail" d="M224 139h1m27 0h1m-17 18c5 3 10 3 15 0" />
    </g>
    <g className="my-life-hero__person my-life-hero__person--parent">
      <path className="person-body" d="M278 276c2-67 20-99 58-99s56 32 58 99H278Z" />
      <path className="person-neck" d="M321 154h27v30h-27z" />
      <circle className="person-face" cx="335" cy="134" r="36" />
      <path className="person-hair" d="M300 131c-4-36 17-55 40-54 28 0 42 23 32 48-15-6-24-16-27-29-10 18-25 29-45 35Z" />
      <path className="person-detail" d="M320 141h1m27 0h1m-17 17c5 3 10 3 15 0" />
    </g>
    <g className="my-life-hero__person my-life-hero__person--parent-two">
      <path className="person-body" d="M365 276c2-59 17-88 50-88s49 29 51 88H365Z" />
      <path className="person-neck" d="M402 165h24v27h-24z" />
      <circle className="person-face" cx="414" cy="146" r="32" />
      <path className="person-hair" d="M383 145c-4-34 16-51 37-50 26 1 37 20 29 43-13-5-22-16-24-27-10 17-23 28-42 34Z" />
      <path className="person-detail" d="M400 153h1m24 0h1m-15 15c4 3 9 3 13 0" />
    </g>
    <g className="my-life-hero__person my-life-hero__person--child">
      <path className="person-body" d="M218 290c2-46 14-69 42-69s40 23 42 69h-84Z" />
      <path className="person-neck" d="M247 195h25v24h-25z" />
      <circle className="person-face" cx="260" cy="180" r="29" />
      <path className="person-hair" d="M232 181c-3-29 13-44 31-43 22 1 33 17 25 37-11-4-18-12-20-21-8 14-19 23-36 27Z" />
      <path className="person-detail" d="M248 187h1m21 0h1m-14 13c3 2 7 2 10 0" />
    </g>
    <g className="my-life-hero__person my-life-hero__person--child-two">
      <path className="person-body" d="M292 290c2-43 13-64 39-64s37 21 39 64h-78Z" />
      <path className="person-neck" d="M319 202h24v22h-24z" />
      <circle className="person-face" cx="331" cy="187" r="27" />
      <path className="person-hair" d="M305 187c-2-27 13-41 30-40 21 1 30 17 23 35-11-3-17-10-19-19-8 13-18 21-34 24Z" />
      <path className="person-detail" d="M320 194h1m20 0h1m-13 12c3 2 7 2 10 0" />
    </g>
    <circle className="my-life-hero__sparkle" cx="83" cy="211" r="4" />
    <circle className="my-life-hero__sparkle" cx="443" cy="200" r="5" />
    <circle className="my-life-hero__sparkle" cx="470" cy="249" r="3" />
  </svg>
);

export const FamilyTreeArtwork: React.FC = () => (
  <svg className="my-life-module-card__family-tree" viewBox="0 0 390 240" fill="none">
    <path className="family-tree__portrait-backdrop" d="M35 220c-7-73 41-155 160-166 118 11 167 93 160 166H35Z" />
    <path className="family-tree__branch" d="M57 194c-15-22-16-42-3-62m3 28c18-1 30-10 35-28m-78 5c17 0 29-7 39-21m259 78c15-22 16-42 3-62m-3 28c-18-1-30-10-35-28m78 5c-17 0-29-7-39-21" />
    <path className="family-tree__leaf" d="M53 134c-19-1-27-13-25-27 18 1 28 10 25 27Zm26-20c-1-19 10-29 24-30 0 18-9 29-24 30Zm232 20c19-1 27-13 25-27-18 1-28 10-25 27Zm-26-20c1-19-10-29-24-30 0 18 9 29 24 30Z" />
    <ellipse className="family-tree__ground" cx="195" cy="220" rx="153" ry="12" />

    <g className="family-portrait__person family-portrait__person--elder-one">
      <path className="family-portrait__body" d="M67 218c2-49 15-75 43-75s42 26 44 75H67Z" />
      <path className="family-portrait__neck" d="M96 126h26v24H96z"/><circle className="family-portrait__face" cx="109" cy="110" r="28" />
      <path className="family-portrait__hair" d="M81 110c-3-29 15-43 32-42 22 1 33 18 24 39-12-4-18-12-20-21-9 14-20 21-36 24Z" />
      <path className="family-portrait__detail" d="M96 117h1m22 0h1m-15 13c4 3 8 3 12 0" />
    </g>
    <g className="family-portrait__person family-portrait__person--elder-two">
      <path className="family-portrait__body" d="M132 218c2-55 17-82 48-82s46 27 48 82H132Z" />
      <path className="family-portrait__neck" d="M163 119h31v28h-31z"/><circle className="family-portrait__face" cx="179" cy="99" r="32" />
      <path className="family-portrait__hair" d="M148 100c-2-32 17-49 37-48 26 1 37 22 28 45-13-5-20-14-22-25-9 15-23 24-43 28Z" />
      <path className="family-portrait__detail" d="M164 107h1m26 0h1m-17 14c4 3 8 3 12 0" />
    </g>
    <g className="family-portrait__person family-portrait__person--adult">
      <path className="family-portrait__body" d="M210 218c2-55 17-82 48-82s46 27 48 82H210Z" />
      <path className="family-portrait__neck" d="M241 119h31v28h-31z"/><circle className="family-portrait__face" cx="257" cy="99" r="32" />
      <path className="family-portrait__hair" d="M226 100c-2-32 17-49 37-48 26 1 37 22 28 45-13-5-20-14-22-25-9 15-23 24-43 28Z" />
      <path className="family-portrait__detail" d="M242 107h1m26 0h1m-17 14c4 3 8 3 12 0" />
    </g>
    <g className="family-portrait__person family-portrait__person--young-one">
      <path className="family-portrait__body" d="M111 222c2-40 13-61 37-61s35 21 37 61h-74Z" />
      <path className="family-portrait__neck" d="M136 147h24v22h-24z"/><circle className="family-portrait__face" cx="148" cy="132" r="25" />
      <path className="family-portrait__hair" d="M124 133c-2-25 12-38 27-37 19 1 28 15 21 33-10-3-16-9-18-18-7 12-16 19-30 22Z" />
      <path className="family-portrait__detail" d="M136 139h1m19 0h1m-12 10c3 2 6 2 9 0" />
    </g>
    <g className="family-portrait__person family-portrait__person--young-two">
      <path className="family-portrait__body" d="M174 222c2-37 12-56 35-56s33 19 35 56h-70Z" />
      <path className="family-portrait__neck" d="M198 154h23v20h-23z"/><circle className="family-portrait__face" cx="210" cy="140" r="23" />
      <path className="family-portrait__hair" d="M188 141c-2-23 11-35 25-34 18 1 26 14 20 30-9-3-14-9-16-16-7 11-15 17-29 20Z" />
      <path className="family-portrait__detail" d="M199 147h1m18 0h1m-11 9c3 2 6 2 8 0" />
    </g>
    <g className="family-portrait__person family-portrait__person--young-three">
      <path className="family-portrait__body" d="M231 222c2-39 12-58 35-58s34 19 36 58h-71Z" />
      <path className="family-portrait__neck" d="M255 152h24v21h-24z"/><circle className="family-portrait__face" cx="267" cy="137" r="24" />
      <path className="family-portrait__hair" d="M244 138c-2-24 12-37 27-36 18 1 27 15 20 31-10-3-15-10-17-18-7 12-16 19-30 23Z" />
      <path className="family-portrait__detail" d="M256 144h1m19 0h1m-12 10c3 2 6 2 9 0" />
    </g>
  </svg>
);

export const AnniversaryArtwork: React.FC = () => (
  <div className="my-life-module-card__anniversary-scene">
    <div className="my-life-module-card__calendar-page">
      <CalendarDays size={26} aria-hidden="true" />
      <div className="my-life-module-card__calendar-grid">{Array.from({ length: 12 }, (_, index) => <i className={index === 6 ? 'is-marked' : ''} key={index} />)}</div>
    </div>
    <div className="my-life-module-card__memory-photo" aria-hidden="true">
      <svg viewBox="0 0 100 76" fill="none"><rect width="100" height="76" rx="9"/><circle cx="51" cy="27" r="12"/><path d="M25 70c2-17 11-26 26-26s24 9 26 26"/><path className="photo-flower" d="M82 24c0-5 7-5 7 0 5-5 10 0 5 5 6 2 3 9-3 8-1 6-8 6-9 0-6 1-8-6-3-8-5-5 0-10 3-5Z"/></svg>
    </div>
    <Flower2 className="my-life-module-card__anniversary-flower" size={22} aria-hidden="true" />
  </div>
);

export const LibraryArtwork: React.FC = () => <div className="my-life-module-card__album-stack" aria-hidden="true">
  <span className="album-photo album-photo--back"><svg viewBox="0 0 100 74"><rect width="100" height="74" rx="8"/><circle cx="72" cy="19" r="9"/><path d="m0 57 27-25 16 14 16-18 41 35v11H0Z"/></svg></span>
  <span className="album-photo album-photo--middle"><svg viewBox="0 0 100 74"><rect width="100" height="74" rx="8"/><circle cx="50" cy="23" r="11"/><path d="M25 68c2-18 11-27 25-27s23 9 25 27"/></svg></span>
  <span className="album-photo album-photo--front"><svg viewBox="0 0 100 74"><rect width="100" height="74" rx="8"/><circle cx="34" cy="26" r="10"/><circle cx="63" cy="24" r="11"/><path d="M13 67c2-17 8-25 21-25s19 8 21 25m-3 0c2-19 9-28 21-28s20 9 22 28"/></svg><BookOpen size={15} aria-hidden="true" /></span>
</div>;

export const FamilyMapArtwork: React.FC = () => (
  <svg className="my-life-module-card__map-illustration" viewBox="0 0 250 190" fill="none">
    <path className="map-land" d="m124 12 18 10 1 16 16 8-4 13 15 9-7 16 13 9-8 15 10 12-9 12 2 17-17 5-8 18-14-8-8-18-15-8-4-18-14-13 8-16-8-13 9-13-7-14 11-11-3-15Z" />
    <path className="map-route" d="M134 36c-18 25 21 35 3 59s19 27 4 52" />
    <circle className="map-stop" cx="133" cy="38" r="7"/><circle className="map-stop" cx="139" cy="96" r="7"/><circle className="map-stop" cx="141" cy="147" r="7"/>
    <path className="map-side-route" d="M139 96c31-14 39-24 57-23"/><circle className="map-stop map-stop--small" cx="197" cy="73" r="5"/>
    <MapPinned className="map-symbol" x="33" y="48" size={30} />
    <circle className="map-deco-dot" cx="64" cy="125" r="4"/><circle className="map-deco-dot" cx="208" cy="132" r="5"/><circle className="map-deco-dot" cx="88" cy="35" r="3"/>
  </svg>
);

export const TimelineArtwork: React.FC = () => <div className="my-life-module-card__timeline-scene" aria-hidden="true">
  <div className="timeline-track" />
  {['01', '02', '03', '04'].map((milestone, index) => <div className={`timeline-memory timeline-memory--${index + 1}`} key={milestone}>
    <span className="timeline-memory__photo"><i /><b /><em /></span>
    <span className="timeline-memory__dot" />
    <span className="timeline-memory__label">{milestone}</span>
  </div>)}
</div>;
