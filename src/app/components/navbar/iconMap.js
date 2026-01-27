// src/app/components/navbar/iconMap.js
import {
  Home,
  Users,
  Settings,
  FileText,
  Calendar,
  MessageSquare,
  Bell,
  HelpCircle,
  BarChart,
  Box,
  Briefcase,
  Clipboard,
  Database,
  UserCog,
  Shield,
  ChevronRight,
  Sparkles,
  DollarSign,
  Building,
  Warehouse,
  ClipboardList,
  FileCheck,
  Calculator,
  Receipt,
  Clock,
  ArrowRightLeft,
  ShoppingCart,
  User,
  Users2,
  Cog,
  ShoppingBag,
  Package
} from "lucide-react";

// Complete map of label to icon component with all your navigation items
const iconMap = {
  // General/Dashboard items
  "Dashboard": Home,
  "Overview": Home,

  // User related
  "Users": Users,
  "Clients": Users2,
  "Employees": Users,
  "Teams & Members": User,

  // Finance related
  "Expenses": DollarSign,
  "Budgets": Calculator,
  "Invoices": Receipt,

  // Resources
  "Projects": Briefcase,
  "Warehouse": Warehouse,
  "Purchases": ShoppingBag,

  // Operations
  "Product Approval": ClipboardList,
  "Employees": Cog,
  "Employees Attendance": Clock,
  "Stock Transfer": ArrowRightLeft,
  "Vendors": ShoppingCart,

  // Document related
  "Documents": FileText,
  "Reports": FileText,
  "Forms": FileCheck,

  // Communication
  "Messages": MessageSquare,
  "Notifications": Bell,

  // Organization
  "Calendar": Calendar,
  "Settings": Settings,
  "Admin": UserCog,
  "Security": Shield,

  // Data & Analytics
  "Tasks": Clipboard,
  "Analytics": BarChart,
  "Inventory": Box,
  "Database": Database,
  "Create Godown": Package,

  // Misc
  "Privileges": Database,
  "Assigned Projects": Briefcase,
  "Engineering Project Expenses": DollarSign
};

export { Sparkles, ChevronRight };
export default iconMap;