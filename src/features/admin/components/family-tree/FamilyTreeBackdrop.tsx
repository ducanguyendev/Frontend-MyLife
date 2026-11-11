import './FamilyTreeBackdrop.css';

/** Fixed atmosphere outside the transformed scene and its measured graph bounds. */
export function FamilyTreeBackdrop() {
  return <div className="family-tree-archive" aria-hidden="true">
    <div className="family-tree-archive__paper" />
    {[false, true].map(mirrored => <svg key={String(mirrored)} className={`family-tree-archive__botanical${mirrored ? ' is-mirrored' : ''}`} viewBox="0 0 280 240" fill="none">
      <path d="M-16 232C34 204 56 153 78 109S123 35 178-12M45 174C7 165 3 134 2 116C30 120 47 141 45 174ZM66 135C101 134 119 112 122 91C94 96 73 110 66 135ZM87 94C56 85 50 61 52 40C78 48 92 68 87 94ZM116 51C147 52 166 34 173 14C148 14 125 28 116 51ZM24 208C60 213 83 195 96 176C65 172 40 187 24 208Z" />
      <path d="M-8 182C10 140 10 91-5 52M7 123C31 112 40 90 38 73C16 82 6 100 7 123Z" />
    </svg>)}
  </div>;
}
