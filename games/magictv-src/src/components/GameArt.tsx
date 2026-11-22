interface Props {
  id: string;
}

/** Original SVG artwork for each game tile. */
export function GameArt({ id }: Props) {
  switch (id) {
    case 'bubble-pop':
      return (
        <svg className="art-svg" viewBox="0 0 300 200" aria-hidden="true">
          <defs>
            <radialGradient id="bp1" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#6ff2ff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#3a7bff" stopOpacity="0.75" />
            </radialGradient>
            <radialGradient id="bp2" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#ff8ad8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#b73bff" stopOpacity="0.75" />
            </radialGradient>
            <radialGradient id="bp3" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#ffe14d" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ff9f43" stopOpacity="0.8" />
            </radialGradient>
          </defs>
          <circle className="float-a" cx="150" cy="100" r="62" fill="url(#bp1)" />
          <circle cx="128" cy="76" r="13" fill="#ffffff" opacity="0.6" />
          <circle className="float-b" cx="232" cy="56" r="30" fill="url(#bp2)" />
          <circle cx="223" cy="46" r="7" fill="#ffffff" opacity="0.65" />
          <circle className="float-c" cx="62" cy="142" r="24" fill="url(#bp3)" />
          <circle cx="55" cy="134" r="5" fill="#ffffff" opacity="0.7" />
          <path className="twinkle" d="M150 84l6 14 14 6-14 6-6 14-6-14-14-6 14-6z" fill="#fff7b0" />
        </svg>
      );
    case 'finger-painting':
      return (
        <svg className="art-svg" viewBox="0 0 300 200" aria-hidden="true">
          <path d="M20 160c40-70 70 10 110-50s60 20 100-40" fill="none" stroke="#ff5d7a" strokeWidth="16" strokeLinecap="round" />
          <path d="M20 176c40-70 70 10 110-50s60 20 100-40" fill="none" stroke="#ff9f43" strokeWidth="12" strokeLinecap="round" />
          <path d="M20 190c40-70 70 10 110-50s60 20 100-40" fill="none" stroke="#ffe14d" strokeWidth="8" strokeLinecap="round" />
          <path className="twinkle" d="M210 40l5 12 12 5-12 5-5 12-5-12-12-5 12-5z" fill="#fff7b0" />
          <path className="twinkle b" d="M60 40l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="#b78bff" />
          <circle cx="150" cy="60" r="6" fill="#4dc4ff" />
          <circle cx="240" cy="110" r="7" fill="#5fdc7a" />
        </svg>
      );
    case 'magic-character':
      return (
        <svg className="art-svg" viewBox="0 0 300 200" aria-hidden="true">
          <ellipse cx="150" cy="182" rx="74" ry="11" fill="#2a1240" opacity="0.35" />
          <g className="float-a">
            <circle cx="100" cy="34" r="24" fill="#a56a2e" />
            <circle cx="200" cy="34" r="24" fill="#a56a2e" />
            <circle cx="100" cy="36" r="13" fill="#f2b68a" />
            <circle cx="200" cy="36" r="13" fill="#f2b68a" />
            <ellipse cx="86" cy="150" rx="26" ry="20" fill="#c68642" />
            <ellipse cx="214" cy="150" rx="26" ry="20" fill="#c68642" />
            <ellipse cx="150" cy="140" rx="58" ry="46" fill="#c68642" />
            <ellipse cx="150" cy="148" rx="34" ry="28" fill="#f8e1b8" />
            <circle cx="150" cy="78" r="56" fill="#c68642" />
            <ellipse cx="150" cy="96" rx="30" ry="23" fill="#f8e1b8" />
            <ellipse cx="150" cy="86" rx="12" ry="8" fill="#4a2a1c" />
            <circle cx="128" cy="68" r="9" fill="#fff" />
            <circle cx="172" cy="68" r="9" fill="#fff" />
            <circle cx="130" cy="70" r="4.5" fill="#33204a" />
            <circle cx="174" cy="70" r="4.5" fill="#33204a" />
            <path d="M138 104q12 10 24 0" fill="none" stroke="#432a55" strokeWidth="4" strokeLinecap="round" />
            <path d="M124 124l26 10 26-10v16l-26-6-26 6z" fill="#ff5d7a" />
            <circle cx="150" cy="132" r="7" fill="#ff8aa5" />
          </g>
        </svg>
      );
    case 'butterfly-garden':
      return (
        <svg className="art-svg" viewBox="0 0 300 200" aria-hidden="true">
          <ellipse cx="150" cy="180" rx="120" ry="18" fill="#4fae4f" opacity="0.5" />
          <path d="M150 180V92" stroke="#3f8f3f" strokeWidth="8" strokeLinecap="round" />
          <path d="M150 150c-26-4-36-22-36-34 20 2 34 14 36 34z" fill="#63c463" />
          <g className="float-b">
            <circle cx="150" cy="62" r="20" fill="#ffd93d" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <ellipse
                key={i}
                cx={150 + Math.cos((i / 6) * Math.PI * 2) * 30}
                cy={62 + Math.sin((i / 6) * Math.PI * 2) * 30}
                rx="18"
                ry="13"
                fill={i % 2 ? '#ff8ad8' : '#ff6b9d'}
                transform={`rotate(${(i / 6) * 360} ${150 + Math.cos((i / 6) * Math.PI * 2) * 30} ${62 + Math.sin((i / 6) * Math.PI * 2) * 30})`}
              />
            ))}
            <circle cx="150" cy="62" r="13" fill="#fff3a0" />
          </g>
          <g className="float-a">
            <ellipse cx="222" cy="70" rx="20" ry="15" fill="#8b6bff" transform="rotate(-20 222 70)" />
            <ellipse cx="244" cy="66" rx="20" ry="15" fill="#b78bff" transform="rotate(20 244 66)" />
            <ellipse cx="226" cy="88" rx="14" ry="11" fill="#ff8ad8" transform="rotate(20 226 88)" />
            <ellipse cx="244" cy="86" rx="14" ry="11" fill="#ffd1f0" transform="rotate(-20 244 86)" />
            <rect x="230" y="66" width="6" height="26" rx="3" fill="#4a3358" />
          </g>
        </svg>
      );
    case 'balloon-party':
      return (
        <svg className="art-svg" viewBox="0 0 300 200" aria-hidden="true">
          <g className="float-a">
            <path d="M104 92c0 14 6 24 12 30" stroke="#fff" strokeOpacity="0.6" strokeWidth="3" fill="none" />
            <ellipse cx="104" cy="66" rx="34" ry="42" fill="#ff5d7a" />
            <ellipse cx="94" cy="50" rx="8" ry="12" fill="#fff" opacity="0.5" />
            <path d="M104 106l-6 10h12z" fill="#ff5d7a" />
            <path d="M104 116c0 16 8 26 2 40" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" fill="none" />
          </g>
          <g className="float-b">
            <ellipse cx="190" cy="54" rx="30" ry="38" fill="#4dc4ff" />
            <ellipse cx="181" cy="40" rx="7" ry="11" fill="#fff" opacity="0.5" />
            <path d="M190 90l-5 9h10z" fill="#4dc4ff" />
            <path d="M190 99c0 18 6 26 0 44" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" fill="none" />
            <path d="M190 40l5 10 10 5-10 5-5 10-5-10-10-5 10-5z" fill="#fff7b0" />
          </g>
          <g className="float-c">
            <ellipse cx="148" cy="112" rx="22" ry="28" fill="#5fdc7a" />
            <ellipse cx="142" cy="102" rx="5" ry="8" fill="#fff" opacity="0.5" />
          </g>
        </svg>
      );
    case 'underwater-adventure':
      return (
        <svg className="art-svg" viewBox="0 0 300 200" aria-hidden="true">
          <path d="M0 150q40-20 80 0t80 0 80 0 60 0v50H0z" fill="#e8d39a" opacity="0.9" />
          <g className="float-a">
            <ellipse cx="150" cy="96" rx="56" ry="34" fill="#ffd93d" />
            <path d="M94 96l-26-20v40z" fill="#ff9f43" />
            <path d="M150 62q10-24 26-4" fill="#ff9f43" />
            <circle cx="180" cy="88" r="7" fill="#fff" />
            <circle cx="182" cy="88" r="3.5" fill="#2b1a3a" />
            <path d="M186 102q8 6 14 0" fill="none" stroke="#2b1a3a" strokeWidth="3" strokeLinecap="round" />
          </g>
          <circle cx="228" cy="52" r="10" fill="none" stroke="#bff6ff" strokeWidth="3" opacity="0.8" />
          <circle cx="248" cy="80" r="6" fill="none" stroke="#bff6ff" strokeWidth="3" opacity="0.7" />
          <path d="M40 180c-8-30 8-50 2-70M60 180c8-26-6-44 0-62" stroke="#3fae7a" strokeWidth="7" strokeLinecap="round" fill="none" />
          <circle cx="96" cy="40" r="4" fill="#bff6ff" opacity="0.7" />
          <circle cx="70" cy="70" r="3" fill="#bff6ff" opacity="0.6" />
        </svg>
      );
    case 'high-five-friends':
      return (
        <svg className="art-svg" viewBox="0 0 300 200" aria-hidden="true">
          <g className="float-a">
            <rect x="52" y="86" width="70" height="66" rx="24" fill="#ffd0ec" stroke="#c0559f" strokeWidth="5" />
            <rect x="58" y="36" width="15" height="64" rx="8" fill="#ffd0ec" stroke="#c0559f" strokeWidth="5" />
            <rect x="76" y="28" width="15" height="72" rx="8" fill="#ffd0ec" stroke="#c0559f" strokeWidth="5" />
            <rect x="94" y="34" width="15" height="66" rx="8" fill="#ffd0ec" stroke="#c0559f" strokeWidth="5" />
            <circle cx="80" cy="120" r="4" fill="#3a2350" />
            <circle cx="98" cy="120" r="4" fill="#3a2350" />
            <path d="M82 132q8 8 16 0" fill="none" stroke="#3a2350" strokeWidth="3" strokeLinecap="round" />
          </g>
          <g className="float-b">
            <rect x="178" y="86" width="70" height="66" rx="24" fill="#ffe9a8" stroke="#c08a00" strokeWidth="5" />
            <rect x="191" y="34" width="15" height="66" rx="8" fill="#ffe9a8" stroke="#c08a00" strokeWidth="5" />
            <rect x="209" y="28" width="15" height="72" rx="8" fill="#ffe9a8" stroke="#c08a00" strokeWidth="5" />
            <rect x="227" y="36" width="15" height="64" rx="8" fill="#ffe9a8" stroke="#c08a00" strokeWidth="5" />
            <circle cx="202" cy="120" r="4" fill="#3a2350" />
            <circle cx="220" cy="120" r="4" fill="#3a2350" />
            <path d="M204 132q8 8 16 0" fill="none" stroke="#3a2350" strokeWidth="3" strokeLinecap="round" />
          </g>
          <path className="twinkle" d="M150 54l7 16 16 7-16 7-7 16-7-16-16-7 16-7z" fill="#fff7b0" />
        </svg>
      );
    case 'buddies':
      return (
        <svg className="art-svg" viewBox="0 0 300 200" aria-hidden="true">
          <g className="float-a">
            <ellipse cx="80" cy="46" rx="10" ry="30" fill="#ffd0ec" stroke="#c0559f" strokeWidth="4" />
            <ellipse cx="116" cy="46" rx="10" ry="30" fill="#ffd0ec" stroke="#c0559f" strokeWidth="4" />
            <circle cx="98" cy="108" r="46" fill="#ffe0f2" stroke="#c0559f" strokeWidth="5" />
            <circle cx="84" cy="102" r="5" fill="#3a2350" />
            <circle cx="112" cy="102" r="5" fill="#3a2350" />
            <path d="M90 120q8 8 16 0" fill="none" stroke="#3a2350" strokeWidth="3.5" strokeLinecap="round" />
          </g>
          <g className="float-b">
            <path d="M178 96l-8-44 36 22z" fill="#ffe2b8" stroke="#b06a10" strokeWidth="4" strokeLinejoin="round" />
            <path d="M250 96l8-44-36 22z" fill="#ffe2b8" stroke="#b06a10" strokeWidth="4" strokeLinejoin="round" />
            <circle cx="214" cy="126" r="42" fill="#ffe9cc" stroke="#b06a10" strokeWidth="5" />
            <circle cx="201" cy="120" r="5" fill="#3a2350" />
            <circle cx="227" cy="120" r="5" fill="#3a2350" />
            <path d="M206 138q8 8 16 0" fill="none" stroke="#3a2350" strokeWidth="3.5" strokeLinecap="round" />
          </g>
          <path className="twinkle" d="M150 30l5 12 12 5-12 5-5 12-5-12-12-5 12-5z" fill="#fff7b0" />
        </svg>
      );
    default:
      return null;
  }
}