
import React from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Share2, 
  FileSpreadsheet, 
  FileText, 
  Send, 
  Mail, 
  MessageCircle,
  ChevronLeft,
  Settings,
  History,
  Sparkles,
  User,
  Truck,
  CreditCard,
  Scale,
  MapPin,
  Users,
  Briefcase,
  DollarSign,
  Gavel,
  Pencil
} from 'lucide-react';

export const ICONS = {
  Plus: <Plus size={20} />,
  Trash: <Trash2 size={18} />,
  Save: <Save size={20} />,
  Edit: <Pencil size={18} />,
  Share: <Share2 size={20} />,
  Excel: <FileSpreadsheet size={20} />,
  PDF: <FileText size={20} />,
  Send: <Send size={20} />,
  Mail: <Mail size={20} />,
  WhatsApp: <MessageCircle size={20} />,
  Back: <ChevronLeft size={24} />,
  Settings: <Settings size={20} />,
  History: <History size={20} />,
  AI: <Sparkles size={16} />,
  User: <User size={18} />,
  Truck: <Truck size={18} />,
  Card: <CreditCard size={18} />,
  Weight: <Scale size={18} />,
  Address: <MapPin size={18} />,
  Contacts: <Users size={18} />,
  Commercial: <Briefcase size={18} />,
  Finance: <DollarSign size={18} />,
  Legal: <Gavel size={18} />
};

const emptyAddress = () => ({
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  zipCode: ''
});

export const INITIAL_CUSTOMER: any = {
  name: '',
  birthday: '',
  document: '',
  rg: '',
  stateRegistration: '',
  municipalRegistration: '',
  phone: '',
  email: '',
  billingAddress: emptyAddress(),
  collectionAddress: emptyAddress(),
  deliveryAddress: emptyAddress(),
};

export const EMPTY_CONTACT = (id: string) => ({
  id,
  name: '',
  jobTitle: '',
  department: '',
  phone: '',
  email: '',
  birthday: ''
});

export const EMPTY_ITEM = (id: string) => ({
  id,
  code: '',
  ncm: '',
  description: '',
  unit: 'UN',
  weight: 0,
  quantity: 1,
  unitPrice: 0,
  discount: 0,
  total: 0
});
