/**
 * The builder's UI icons: Phosphor Icons (MIT licence), Bold weight.
 *
 * Every UI icon comes from here, never straight from '@phosphor-icons/react',
 * so the weight rule lives in one place. Rules from the Worksheet Builder UI plan:
 *   - Default: Bold, inheriting the text colour (dark-olive).
 *   - Active or selected: Fill in sky-blue, or Bold on a sun-yellow pill.
 *   - Disabled: Bold in ink-muted.
 *   - Never Regular: the 1.5px stroke reads too thin next to Nunito 800 labels.
 * Hand-drawn or AI picture art is never used as a UI icon.
 *
 * The exports keep the names the builder used with Lucide, so each call site
 * reads the same. To add an icon, wrap its Phosphor version with `bold()` below.
 * Size icons with Tailwind w-/h- classes; the colour follows `currentColor`.
 */
import type { Icon as PhosphorIcon, IconProps } from '@phosphor-icons/react';
import {
  ArrowCounterClockwiseIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowUUpLeftIcon,
  ArrowUUpRightIcon,
  ArrowsOutIcon,
  BookOpenIcon,
  CaretDoubleLeftIcon,
  CaretDoubleRightIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CheckIcon,
  CloudIcon,
  CloudSlashIcon,
  CopyIcon,
  DownloadSimpleIcon,
  FilePlusIcon,
  FileTextIcon,
  FloppyDiskIcon,
  FolderOpenIcon,
  GearSixIcon,
  ListIcon,
  MagnifyingGlassIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  PencilSimpleIcon,
  PlusIcon,
  PrinterIcon,
  ShareNetworkIcon,
  SignOutIcon,
  SlidersHorizontalIcon,
  SmileyIcon,
  SparkleIcon,
  SquaresFourIcon,
  TrashIcon,
  UserIcon,
  XIcon,
} from '@phosphor-icons/react';

export type UiIconProps = IconProps;
export type UiIcon = (props: UiIconProps) => React.ReactElement;

/** Wraps a Phosphor icon so it renders Bold unless a weight is passed (e.g. "fill" for active). */
function bold(Icon: PhosphorIcon, name: string): UiIcon {
  const Wrapped: UiIcon = ({ weight = 'bold', ...props }) => <Icon weight={weight} {...props} />;
  (Wrapped as { displayName?: string }).displayName = name;
  return Wrapped;
}

// Actions
export const Plus = bold(PlusIcon, 'Plus');
export const X = bold(XIcon, 'X');
export const Trash2 = bold(TrashIcon, 'Trash2');
export const Pencil = bold(PencilSimpleIcon, 'Pencil');
export const Copy = bold(CopyIcon, 'Copy');
export const Check = bold(CheckIcon, 'Check');
export const RotateCcw = bold(ArrowCounterClockwiseIcon, 'RotateCcw');
export const Undo2 = bold(ArrowUUpLeftIcon, 'Undo2');
export const Redo2 = bold(ArrowUUpRightIcon, 'Redo2');
export const Search = bold(MagnifyingGlassIcon, 'Search');
export const Sparkles = bold(SparkleIcon, 'Sparkles');
export const Smile = bold(SmileyIcon, 'Smile');

// Files and saving
export const FilePlus2 = bold(FilePlusIcon, 'FilePlus2');
export const FileText = bold(FileTextIcon, 'FileText');
export const FolderOpen = bold(FolderOpenIcon, 'FolderOpen');
export const Save = bold(FloppyDiskIcon, 'Save');
export const Download = bold(DownloadSimpleIcon, 'Download');
export const Printer = bold(PrinterIcon, 'Printer');
export const Share2 = bold(ShareNetworkIcon, 'Share2');
export const BookOpen = bold(BookOpenIcon, 'BookOpen');
export const Cloud = bold(CloudIcon, 'Cloud');
export const CloudOff = bold(CloudSlashIcon, 'CloudOff');

// Account and settings
export const UserRound = bold(UserIcon, 'UserRound');
export const LogOut = bold(SignOutIcon, 'LogOut');
export const Settings = bold(GearSixIcon, 'Settings');
export const Settings2 = bold(SlidersHorizontalIcon, 'Settings2');
export const Menu = bold(ListIcon, 'Menu');

// Navigation and layout
export const ArrowUp = bold(ArrowUpIcon, 'ArrowUp');
export const ArrowDown = bold(ArrowDownIcon, 'ArrowDown');
export const ArrowRight = bold(ArrowRightIcon, 'ArrowRight');
export const ArrowLeft = bold(ArrowLeftIcon, 'ArrowLeft');
export const ChevronDown = bold(CaretDownIcon, 'ChevronDown');
export const ChevronLeft = bold(CaretLeftIcon, 'ChevronLeft');
export const ChevronRight = bold(CaretRightIcon, 'ChevronRight');
export const PanelLeftOpen = bold(CaretDoubleRightIcon, 'PanelLeftOpen');
export const PanelLeftClose = bold(CaretDoubleLeftIcon, 'PanelLeftClose');
export const LayoutGrid = bold(SquaresFourIcon, 'LayoutGrid');
export const ZoomIn = bold(MagnifyingGlassPlusIcon, 'ZoomIn');
export const ZoomOut = bold(MagnifyingGlassMinusIcon, 'ZoomOut');
export const Maximize2 = bold(ArrowsOutIcon, 'Maximize2');
