import { Image, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import * as Lucide from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

const icons = {
  add: Lucide.CirclePlus,
  'alert-circle': Lucide.CircleAlert,
  'alert-circle-outline': Lucide.CircleAlert,
  'arrow-back': Lucide.ArrowLeft,
  'arrow-forward': Lucide.ArrowRight,
  home: Lucide.House,
  'home-outline': Lucide.House,
  bed: Lucide.Bed,
  'bed-outline': Lucide.Bed,
  business: Lucide.Building2,
  'business-outline': Lucide.Building2,
  'calendar-outline': Lucide.CalendarDays,
  'call-outline': Lucide.Phone,
  'camera-outline': Lucide.Camera,
  'camera-reverse-outline': Lucide.Camera,
  card: Lucide.CreditCard,
  'card-outline': Lucide.CreditCard,
  'cash-outline': Lucide.Banknote,
  checkmark: Lucide.Check,
  'checkmark-circle': Lucide.CircleCheck,
  'checkmark-circle-outline': Lucide.CircleCheck,
  'checkmark-done': Lucide.BadgeCheck,
  'checkmark-done-outline': Lucide.CheckCheck,
  'checkmark-done-circle': Lucide.BadgeCheck,
  'chevron-down': Lucide.ChevronDown,
  'chevron-up': Lucide.ChevronUp,
  'chevron-forward': Lucide.ChevronRight,
  close: Lucide.X,
  'close-circle': Lucide.CircleX,
  'eye-outline': Lucide.Eye,
  'eye-off-outline': Lucide.EyeOff,
  compass: Lucide.Compass,
  'compass-outline': Lucide.Compass,
  construct: Lucide.Wrench,
  'construct-outline': Lucide.Wrench,
  'create-outline': Lucide.PencilLine,
  'desktop-outline': Lucide.Monitor,
  ellipse: Lucide.Circle,
  'finger-print-outline': Lucide.Fingerprint,
  'git-branch-outline': Lucide.GitBranch,
  'id-card-outline': Lucide.IdCard,
  image: Lucide.Image,
  'image-outline': Lucide.Image,
  information: Lucide.Info,
  'information-circle': Lucide.Info,
  'information-circle-outline': Lucide.Info,
  'key-outline': Lucide.KeyRound,
  location: Lucide.MapPin,
  'location-outline': Lucide.MapPin,
  'location-sharp': Lucide.MapPin,
  'lock-closed-outline': Lucide.LockKeyhole,
  'log-out-outline': Lucide.LogOut,
  'mail-outline': Lucide.Mail,
  'mail-unread-outline': Lucide.MailOpen,
  notifications: Lucide.Bell,
  'notifications-outline': Lucide.Bell,
  'open-outline': Lucide.ExternalLink,
  'options-outline': Lucide.SlidersHorizontal,
  'pencil-outline': Lucide.Pencil,
  people: Lucide.UsersRound,
  'people-outline': Lucide.UsersRound,
  person: Lucide.UserRound,
  'person-circle-outline': Lucide.CircleUserRound,
  'person-outline': Lucide.UserRound,
  play: Lucide.Play,
  'refresh-outline': Lucide.RefreshCw,
  school: Lucide.GraduationCap,
  'school-outline': Lucide.GraduationCap,
  search: Lucide.Search,
  'search-outline': Lucide.Search,
  send: Lucide.Send,
  'shield-checkmark': Lucide.ShieldCheck,
  'shield-checkmark-outline': Lucide.ShieldCheck,
  'shield-outline': Lucide.Shield,
  sparkles: Lucide.Bot,
  star: Lucide.Star,
  'star-outline': Lucide.Star,
  time: Lucide.Clock,
  'time-outline': Lucide.Clock,
  'trash-outline': Lucide.Trash2,
  'warning-outline': Lucide.TriangleAlert,
  warning: Lucide.TriangleAlert,
  clipboard: Lucide.ClipboardList,
  'clipboard-outline': Lucide.ClipboardList,
  'chatbox-ellipses': Lucide.MessageCircleMore,
  'chatbox-ellipses-outline': Lucide.MessageCircleMore,
  'arrow-up-right': Lucide.ArrowUpRight,
  'play-circle-outline': Lucide.CirclePlay,
  'sparkles-outline': Lucide.Sparkles,
  'water-outline': Lucide.Droplets,
  'flash-outline': Lucide.Zap,
  'volume-high-outline': Lucide.Volume2,
  'receipt-outline': Lucide.Receipt,
  'chatbubble-ellipses-outline': Lucide.MessageCircleMore,
  calendar: Lucide.CalendarDays,
  megaphone: Lucide.Megaphone,
  upload: Lucide.Upload,
  'document-text': Lucide.FileText,
  'cash': Lucide.CircleDollarSign,
  'calendar-check': Lucide.CalendarCheck,
  help: Lucide.CircleHelp,
  'help-circle': Lucide.CircleHelp,
  'help-circle-outline': Lucide.CircleHelp,
  'message-square': Lucide.MessageSquare,
  wifi: Lucide.Wifi,
  laundry: Lucide.WashingMachine,
  minus: Lucide.Minus,
  'triangle-alert': Lucide.TriangleAlert,
  'circle-alert': Lucide.CircleAlert,
  'shield-alert': Lucide.ShieldAlert,
  copy: Lucide.Copy,
  'copy-check': Lucide.CopyCheck,
  'wifi-off': Lucide.WifiOff,
  'chevron-left': Lucide.ChevronLeft,
  filter: Lucide.ListFilter,
  'filter-outline': Lucide.ListFilter,
  'file-tray-outline': Lucide.Inbox,
  'document-text-outline': Lucide.FileText,
  'swap-vertical-outline': Lucide.ArrowDownUp,
  history: Lucide.History,
  'circle-dollar-sign': Lucide.CircleDollarSign,
  'message-circle': Lucide.MessageCircle,
  'lock-keyhole': Lucide.LockKeyhole,
  'map-pin': Lucide.MapPin,
  'circle-check': Lucide.CircleCheck,
  'external-link': Lucide.ExternalLink,
  'arrow-right': Lucide.ArrowRight,
  'file-text': Lucide.FileText,
  'calendar-days': Lucide.CalendarDays,
  'clock-3': Lucide.Clock3,
  'circle-help': Lucide.CircleHelp,
  'thumbs-up': Lucide.ThumbsUp,
} satisfies Record<string, LucideIcon>;

export type AppIconName = keyof typeof icons;
export interface AppIconProps {
  name: AppIconName | string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
  style?: StyleProp<ViewStyle>;
}

export function AppIcon({ name, size = 20, color = '#0b1220', strokeWidth = 1.65, fill, style }: AppIconProps) {
  const IconComponent = icons[name as AppIconName] ?? Lucide.CircleHelp;
  return <IconComponent size={size} color={color} strokeWidth={strokeWidth} fill={fill ?? (name === 'star' ? color : 'none')} style={style} />;
}

/** Keep existing Ionicons-style icon references working while the app uses one Lucide set. */
export namespace AppIcon {
  export const glyphMap = icons;
}

export function BrandMark({ size = 44 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: Math.max(10, size * 0.28), overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b1220' }}>
      <Image source={require('../../../assets/brand/hostelhive-logo-ui.png')} resizeMode="contain" style={{ width: size, height: size }} />
    </View>
  );
}
