import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function baseProps({ size = 24, ...props }: IconProps): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...props,
  };
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="m15.5 5.5 3 3" />
      <path d="M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
      <path d="m13.5 6.5 3 3" />
    </svg>
  );
}

export function BrushIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M14.5 4.5 19 9 9.5 18.5 5 14l9.5-9.5Z" />
      <path d="M4 20c2.8 0 5-2.2 5-5-2.8 0-5 2.2-5 5Z" />
      <path d="m13 6 5 5" />
    </svg>
  );
}

export function EraserIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="m4 16 8-8 6 6-5 5H7l-3-3Z" />
      <path d="m10 10 6 6" />
      <path d="M13 19h7" />
    </svg>
  );
}

export function BucketIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="m5 11 6-6 7 7-6 6a2.8 2.8 0 0 1-4 0l-3-3a2.8 2.8 0 0 1 0-4Z" />
      <path d="m9 7 3-3" />
      <path d="M19 15c0 1.1.9 2 2 2s2-.9 2-2-2-4-2-4-2 2.9-2 4Z" transform="translate(-2 0)" />
    </svg>
  );
}

export function UndoIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M9 7 4 12l5 5" />
      <path d="M4 12h8a6 6 0 0 1 6 6v1" />
    </svg>
  );
}

export function RedoIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="m15 7 5 5-5 5" />
      <path d="M20 12h-8a6 6 0 0 0-6 6v1" />
    </svg>
  );
}

export function SaveIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M5 4h11l3 3v13H5V4Z" />
      <path d="M8 4v5h7V4" />
      <path d="M8 20v-6h8v6" />
    </svg>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22V5.5Z" />
    </svg>
  );
}

export function GalleryIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="m6 16 4-4 3 3 2-2 3 3" />
      <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M20 7v5h-5" />
      <path d="M19 12a7 7 0 1 0-2 5" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="m6 7 1 14h10l1-14" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function EditIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="m14 5 5 5" />
      <path d="M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export function CloudCheckIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M7 18a4.5 4.5 0 0 1-.7-8.9A6 6 0 0 1 18 8.5a4.5 4.5 0 0 1-.5 9" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  );
}

export function CloudOffIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M7 18a4.5 4.5 0 0 1-.7-8.9A6 6 0 0 1 18 8.5a4.5 4.5 0 0 1 1.6 8.6" />
      <path d="m4 4 16 16" />
    </svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
      <path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" />
    </svg>
  );
}