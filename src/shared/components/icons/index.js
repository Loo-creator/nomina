import AlertCircleIcon from './AlertCircleIcon.vue'
import ArchiveIcon from './ArchiveIcon.vue'
import BellIcon from './BellIcon.vue'
import BuildingIcon from './BuildingIcon.vue'
import CheckCircleIcon from './CheckCircleIcon.vue'
import CheckIcon from './CheckIcon.vue'
import ChevronDownIcon from './ChevronDownIcon.vue'
import ChevronLeftIcon from './ChevronDownIcon.vue'
import ChevronRightIcon from './ChevronRightIcon.vue'
import ChevronUpIcon from './ChevronUpIcon.vue'
import ClockIcon from './ClockIcon.vue'
import CreditCardIcon from './CreditCardIcon.vue'
import DashboardIcon from './DashboardIcon.vue'
import DownloadIcon from './DownloadIcon.vue'
import FileIcon from './FileIcon.vue'
import FileInvoiceIcon from './FileInvoiceIcon.vue'
import FileTextIcon from './FileTextIcon.vue'
import HistoryIcon from './HistoryIcon.vue'
import HomeIcon from './HomeIcon.vue'
import LockIcon from './LockIcon.vue'
import ListIcon from './ListIcon.vue'
import LogoutIcon from './LogoutIcon.vue'
import MailIcon from './MailIcon.vue'
import MenuIcon from './MenuIcon.vue'
import MoonIcon from './MoonIcon.vue'
import PaletteIcon from './PaletteIcon.vue'
import PlusIcon from './PlusIcon.vue'
import ReceiptIcon from './ReceiptIcon.vue'
import SearchIcon from './SearchIcon.vue'
import ShieldCheckIcon from './ShieldCheckIcon.vue'
import StampIcon from './StampIcon.vue'
import SunIcon from './SunIcon.vue'
import UploadIcon from './UploadIcon.vue'
import UserCogIcon from './UserCogIcon.vue'
import UserIcon from './UserIcon.vue'
import UsersIcon from './UsersIcon.vue'
import XCircleIcon from './XCircleIcon.vue'
import XMarkIcon from './XMarkIcon.vue'

const icons = {
  AlertCircleIcon,
  ArchiveIcon,
  BellIcon,
  BuildingIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ClockIcon,
  CreditCardIcon,
  DashboardIcon,
  DownloadIcon,
  FileIcon,
  FileInvoiceIcon,
  FileTextIcon,
  HistoryIcon,
  HomeIcon,
  LockIcon,
  ListIcon,
  LogoutIcon,
  MailIcon,
  MenuIcon,
  MoonIcon,
  PaletteIcon,
  PlusIcon,
  ReceiptIcon,
  SearchIcon,
  ShieldCheckIcon,
  StampIcon,
  SunIcon,
  UploadIcon,
  UserCogIcon,
  UserIcon,
  UsersIcon,
  XCircleIcon,
  XMarkIcon,
}

export default icons

export function registerIcons(app) {
  Object.entries(icons).forEach(([name, component]) => {
    app.component(name, component)
  })
}
