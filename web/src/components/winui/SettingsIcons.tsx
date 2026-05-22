function IconWrapper({ children, size = 24 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export function ThemeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M5.75 2a.75.75 0 0 0-.75.75v11.5a2.25 2.25 0 0 0 2.25 2.25H9.5v3a2.5 2.5 0 1 0 5 0v-3h2.25A2.25 2.25 0 0 0 19 14.25V2.75a.75.75 0 0 0-.75-.75H5.75Zm.75 9V3.5h6v1.752a.75.75 0 1 0 1.5 0V3.5h1v2.751a.75.75 0 1 0 1.5 0V3.5h1V11h-11Zm0 3.25V12.5h11v1.75a.75.75 0 0 1-.75.75h-3a.75.75 0 0 0-.75.75v3.75a1 1 0 0 1-2 0v-3.75a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 1-.75-.75Z" />
    </svg>
  );
}

export function ViewIcon() {
  return <IconWrapper>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </IconWrapper>;
}

export function ConflictIcon() {
  return <IconWrapper>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="13" y2="17" />
    <path d="M2 6l3 3-3 3" />
    <path d="M2 9h5" />
  </IconWrapper>;
}

export function BellIcon() {
  return <IconWrapper>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </IconWrapper>;
}

export function TagAutoIcon() {
  return <IconWrapper>
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
    <path d="M7 7h.01" />
  </IconWrapper>;
}

export function FolderIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M8.207 4c.46 0 .908.141 1.284.402l.156.12L12.022 6.5h7.728a2.25 2.25 0 0 1 2.229 1.938l.016.158.005.154v9a2.25 2.25 0 0 1-2.096 2.245L19.75 20H4.25a2.25 2.25 0 0 1-2.245-2.096L2 17.75V6.25a2.25 2.25 0 0 1 2.096-2.245L4.25 4h3.957Zm1.44 5.979a2.25 2.25 0 0 1-1.244.512l-.196.009-4.707-.001v7.251c0 .38.282.694.648.743l.102.007h15.5a.75.75 0 0 0 .743-.648l.007-.102v-9a.75.75 0 0 0-.648-.743L19.75 8h-7.729L9.647 9.979ZM8.207 5.5H4.25a.75.75 0 0 0-.743.648L3.5 6.25v2.749L8.207 9a.75.75 0 0 0 .395-.113l.085-.06 1.891-1.578-1.89-1.575a.75.75 0 0 0-.377-.167L8.207 5.5Z" />
    </svg>
  );
}

export function FolderSearchIcon() {
  return <IconWrapper>
    <circle cx="17" cy="17" r="3" />
    <path d="M10.7 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v4.1" />
    <path d="m21 21-1.5-1.5" />
  </IconWrapper>;
}

export function FolderExportIcon() {
  return <IconWrapper>
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    <path d="M12 10v6" />
    <path d="m9 13 3-3 3 3" />
  </IconWrapper>;
}

export function LayersIcon() {
  return <IconWrapper>
    <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
    <line x1="12" y1="22" x2="12" y2="15.5" />
    <polyline points="22 8.5 12 15.5 2 8.5" />
  </IconWrapper>;
}

export function TerminalIcon() {
  return <IconWrapper>
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </IconWrapper>;
}

export function MonitorIcon() {
  return <IconWrapper>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </IconWrapper>;
}

export function CpuIcon() {
  return <IconWrapper>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="14" x2="4" y2="14" />
  </IconWrapper>;
}

export function GaugeIcon() {
  return <IconWrapper>
    <line x1="4" y1="6" x2="20" y2="6" />
    <polyline points="16 3 20 6 16 9" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <polyline points="16 9 20 12 16 15" />
    <line x1="4" y1="18" x2="20" y2="18" />
    <polyline points="16 15 20 18 16 21" />
  </IconWrapper>;
}

export function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1103 1024" width="24" height="24" fill="currentColor" stroke="none">
      <path d="M123.649312 583.904806h197.118315c26.127231 0 51.193851 10.347418 69.689862 28.791691a98.300472 98.300472 0 0 1 28.869296 69.53465v217.580336a98.196998 98.196998 0 0 1-28.869296 69.53465 98.714369 98.714369 0 0 1-69.689862 28.817559h-197.118315a98.714369 98.714369 0 0 1-69.689862-28.817559 98.17113 98.17113 0 0 1-28.843428-69.53465v-217.580336c0-26.075494 10.373287-51.090377 28.843428-69.53465a98.688501 98.688501 0 0 1 69.689862-28.791691z m0 98.326341v217.580336h197.118315v-217.580336h-197.118315z m418.863487-53.004649h492.769921a24.652724 24.652724 0 0 1 24.626855 24.575118v49.176105a24.497512 24.497512 0 0 1-24.626855 24.575118H542.512799a24.626855 24.626855 0 0 1-24.652724-24.575118v-49.176105c0-13.580986 11.045869-24.575118 24.652724-24.575118z m0 241.974374h492.769921a24.652724 24.652724 0 0 1 24.626855 24.600986v49.150236a24.497512 24.497512 0 0 1-24.626855 24.575119H542.512799a24.600987 24.600987 0 0 1-24.652724-24.575119v-49.150236a24.575118 24.575118 0 0 1 24.652724-24.600986zM1060.194129 111.85559v194.298645c0 25.739203-10.347418 50.443664-28.791691 68.680988a98.973055 98.973055 0 0 1-69.53465 28.429531H123.442363a98.973055 98.973055 0 0 1-69.53465-28.429531 96.593148 96.593148 0 0 1-28.791691-68.680988V111.85559c0-25.739203 10.347418-50.469532 28.791691-68.680988A98.973055 98.973055 0 0 1 123.442363 14.745071h838.425425c26.075494 0 51.090377 10.218075 69.53465 28.429531a96.541411 96.541411 0 0 1 28.791691 68.680988z m-98.326341 0H123.442363v194.298645h838.425425V111.85559z" />
    </svg>
  );
}

export function ImageIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M17.75 3A3.25 3.25 0 0 1 21 6.25v11.5A3.25 3.25 0 0 1 17.75 21H6.25A3.25 3.25 0 0 1 3 17.75V6.25A3.25 3.25 0 0 1 6.25 3h11.5Zm.58 16.401-5.805-5.686a.75.75 0 0 0-.966-.071l-.084.07-5.807 5.687c.182.064.378.099.582.099h11.5c.203 0 .399-.035.58-.099l-5.805-5.686L18.33 19.4ZM17.75 4.5H6.25A1.75 1.75 0 0 0 4.5 6.25v11.5c0 .208.036.408.103.594l5.823-5.701a2.25 2.25 0 0 1 3.02-.116l.128.116 5.822 5.702c.067-.186.104-.386.104-.595V6.25a1.75 1.75 0 0 0-1.75-1.75Zm-2.498 2a2.252 2.252 0 1 1 0 4.504 2.252 2.252 0 0 1 0-4.504Zm0 1.5a.752.752 0 1 0 0 1.504.752.752 0 0 0 0-1.504Z" />
    </svg>
  );
}

export function GridIcon() {
  return <IconWrapper>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </IconWrapper>;
}

export function FolderCodeIcon() {
  return <IconWrapper>
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    <polyline points="10 13 7 16 10 19" />
    <polyline points="17 13 14 16 17 19" />
  </IconWrapper>;
}

export function InfoIcon() {
  return <IconWrapper>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </IconWrapper>;
}
