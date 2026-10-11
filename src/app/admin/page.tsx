'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { BrandLogo } from '@/components/BrandLogo';
import { MotionScene } from '@/components/MotionScene';
import { AdminWebsiteEditor } from '@/components/AdminWebsiteEditor';
import { SellRequestPhotos } from '@/components/SellRequestPhotos';
import { AdminVehiclePhotoUpload } from '@/components/AdminVehiclePhotoUpload';
import styles from './admin.module.css';
import Link from 'next/link';
import { VehicleImage } from '@/components/VehicleImage';
import {
  Shield,
  LayoutDashboard,
  Car,
  Palette,
  ClipboardCheck,
  DollarSign,
  Search,
  MessageSquare,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Check,
  Lock,
  ArrowLeft,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Database,
  RefreshCw,
  X,
  CheckCircle2,
  ArrowUpRight,
  LogOut,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { createThemeTokens } from '@/lib/theme-tokens';
import { api, ADMIN_SESSION_EXPIRED } from '@/lib/api-client';
import { formatPKR, formatMileage } from '@/lib/utils';
import type {
  Vehicle,
  InspectionBooking,
  CustomerInquiry,
  SellCarRequest,
  FindCarRequest,
  Theme,
  DealershipSettings,
} from '@/types';

const readable = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const dateLabel = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
};
function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={`${styles.field} ${wide ? styles.fieldWide : ''}`}><span>{label}</span>{children}</label>;
}
function Badge({ status }: { status: string }) {
  return <span className={styles.badge} data-status={status}>{readable(status)}</span>;
}
function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className={styles.empty}><Car size={28} /><h3>{title}</h3><p>{detail}</p></div>;
}
function assertSuccess(result: unknown) {
  if (result && typeof result === 'object' && 'success' in result && !result.success) {
    const response = result as { message?: string; error?: { message?: string } };
    throw new Error(response.error?.message || response.message || 'Unable to save this change. Please try again.');
  }
}

export default function AdminPage() {
  return <MotionScene><AdminExperience /></MotionScene>;
}

function AdminExperience() {
  const { currentTheme, themes, setTheme, saveCustomTheme, deleteCustomTheme } =
    useTheme();
  const themePreviews = useMemo(() => Object.fromEntries(themes.map((theme) => [theme.id, createThemeTokens(theme).tokens])), [themes]);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'vehicles'
    | 'themes'
    | 'inspections'
    | 'sell_requests'
    | 'find_requests'
    | 'inquiries'
    | 'settings'
  >('overview');

  // Data State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [inspections, setInspections] = useState<InspectionBooking[]>([]);
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
  const [sellRequests, setSellRequests] = useState<SellCarRequest[]>([]);
  const [findRequests, setFindRequests] = useState<FindCarRequest[]>([]);
  const [dealershipSettings, setDealershipSettings] =
    useState<DealershipSettings | null>(null);
  const [websiteDirty, setWebsiteDirty] = useState(false);
  const settingsRevision = useRef(0);
  const [dbStatus, setDbStatus] = useState<{
    has_db_url: boolean;
    db_connected: boolean;
    source: string;
  } | null>(null);

  // Loading & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const adminRoot = useRef<HTMLDivElement>(null);
  const adminMain = useRef<HTMLElement>(null);
  const previousAnimatedTab = useRef(activeTab);
  const toast = useRef<HTMLDivElement>(null);
  const vehicleDialog = useRef<HTMLDialogElement>(null);
  const dialogMotion = useRef<gsap.Context | null>(null);
  const dialogClosing = useRef(false);
  const dialogOpener = useRef<HTMLElement | null>(null);
  const dialogOpeningPath = useRef('');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Vehicle Filters & Search
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicleBrandFilter, setVehicleBrandFilter] = useState('all');
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState('all');

  // Modals
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleFormData, setVehicleFormData] = useState({
    title: '',
    brand: '',
    model: '',
    year: '',
    price: '',
    mileage: '',
    fuelType: '' as Vehicle['fuelType'] | '',
    transmission: '' as Vehicle['transmission'] | '',
    bodyType: '' as Vehicle['bodyType'] | '',
    condition: '' as Vehicle['condition'] | '',
    inspectionScore: '',
    color: '',
    location: '',
    status: '' as Vehicle['status'] | '',
    featured: false,
    images: '',
    features: '',
    description: '',
  });
  const [vehiclePhotos, setVehiclePhotos] = useState<File[]>([]);

  // Custom Theme Form
  const [customThemeForm, setCustomThemeForm] = useState({
    name: 'Custom Prestige Spec',
    category: 'Bespoke Dealership',
    description: 'High-contrast luxury theme configured via Parakh Motors Studio.',
    background: '#0d0d12',
    foreground: '#f3f4f6',
    card_bg: 'rgba(20, 20, 28, 0.85)',
    border_color: 'rgba(242, 89, 18, 0.4)',
    primary: '#F25912',
    accent: '#ea3828',
    glow_color: 'rgba(242, 89, 18, 0.3)',
  });

  const notificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (notificationTimer.current) clearTimeout(notificationTimer.current);
    setNotification({ message, type });
    notificationTimer.current = setTimeout(() => setNotification(null), 6000);
  }, []);
  useEffect(() => () => { if (notificationTimer.current) clearTimeout(notificationTimer.current); }, []);
  useEffect(() => {
    const expireSession = () => {
      setIsAuthenticated(false);
      setIsVehicleModalOpen(false);
      setVehicles([]);
      setInspections([]);
      setInquiries([]);
      setSellRequests([]);
      setFindRequests([]);
      setDealershipSettings(null);
      setDbStatus(null);
      setPasswordInput('');
      setAuthError('Your session has expired. Please sign in again to continue.');
    };
    window.addEventListener(ADMIN_SESSION_EXPIRED, expireSession);
    return () => window.removeEventListener(ADMIN_SESSION_EXPIRED, expireSession);
  }, []);
  useEffect(() => {
    const main = adminMain.current;
    if (!isAuthenticated || isLoading || !main) return;
    // Keep the first rendered page visible; animate only a requested tab change.
    if (previousAnimatedTab.current === activeTab) return;
    previousAnimatedTab.current = activeTab;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(main.querySelectorAll('[data-admin-panel]'), { y: 8 }, { y: 0, duration: .3, ease: 'power3.out', clearProps: 'transform' });
    }, main);
    return () => media.revert();
  }, [isAuthenticated, isLoading, activeTab]);
  useEffect(() => {
    if (!notification || !toast.current) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(toast.current, { x: 25, y: 10, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: .45, ease: 'power3.out', clearProps: 'transform,opacity' });
    });
    return () => media.revert();
  }, [notification, isAuthenticated]);
  useEffect(() => {
    if (!authError) return;
    const error = adminRoot.current?.querySelector('#admin-auth-error');
    if (!error) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(error, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: .3, ease: 'power2.out', clearProps: 'transform,opacity' });
    });
    return () => media.revert();
  }, [authError]);
  const finishVehicleDialogClose = useCallback(() => {
    vehicleDialog.current?.close();
    if (dialogOpeningPath.current === window.location.pathname && dialogOpener.current?.isConnected) {
      dialogOpener.current.focus({ preventScroll: true });
    }
    setIsVehicleModalOpen(false);
  }, []);
  useEffect(() => {
    const dialog = vehicleDialog.current;
    if (!dialog || !isVehicleModalOpen || !isAuthenticated) return;
    dialogClosing.current = false;
    dialogOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogOpeningPath.current = window.location.pathname;
    if (!dialog.open) dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const media = gsap.matchMedia();
    media.add({ animate: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, context => {
      dialogMotion.current = context;
      if (context.conditions?.reduce) {
        if (dialogClosing.current) finishVehicleDialogClose();
        return;
      }
      gsap.fromTo(dialog, { opacity: 0, y: 28, scale: .975, '--dialog-backdrop-opacity': 0 }, { opacity: 1, y: 0, scale: 1, '--dialog-backdrop-opacity': 1, duration: .45, ease: 'power3.out' });
      gsap.fromTo(dialog.querySelector(`.${styles.dialogHeader}`), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .4, delay: .12, ease: 'power2.out', clearProps: 'transform,opacity' });
    }, dialog);
    return () => {
      dialogMotion.current = null;
      media.revert();
      dialog.close();
      document.body.style.overflow = overflow;
    };
  }, [isVehicleModalOpen, isAuthenticated, finishVehicleDialogClose]);
  const closeVehicleDialog = useCallback((afterSave = false) => {
    if ((isSaving && !afterSave) || dialogClosing.current) return;
    const dialog = vehicleDialog.current;
    dialogClosing.current = true;
    if (!dialog || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !dialogMotion.current) {
      finishVehicleDialogClose();
      return;
    }
    dialogMotion.current.add(() => {
      gsap.killTweensOf(dialog);
      gsap.to(dialog, { y: 18, scale: .985, opacity: 0, '--dialog-backdrop-opacity': 0, duration: .2, ease: 'power2.in', onComplete: finishVehicleDialogClose });
    });
  }, [isSaving, finishVehicleDialogClose]);

  // Check initial admin session
  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      try {
        const res = await api.admin.checkSession();
        if (isMounted && res.authenticated) {
          setIsAuthenticated(true);
        }
      } catch {
        // Fall back to login screen
      } finally {
        if (isMounted) setIsCheckingSession(false);
      }
    }
    checkSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch all admin data
  const loadAllData = useCallback(async () => {
    const revision = ++settingsRevision.current;
    try {
      setIsLoading(true);
      setLoadError('');
      const res = await api.admin.getAllData();
      assertSuccess(res);
      if (res.success && res.data) {
        setVehicles(res.data.vehicles || []);
        setInspections(res.data.inspections || []);
        setInquiries(res.data.inquiries || []);
        setSellRequests(res.data.sellRequests || []);
        setFindRequests(res.data.findRequests || []);
        if (revision === settingsRevision.current) setDealershipSettings(res.data.settings || null);
        setDbStatus(res.status || null);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setDbStatus(null);
      setLoadError(err instanceof Error ? err.message : 'Unable to load showroom information.');
      showNotification('Failed to load store data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    if (isAuthenticated) {
      void Promise.resolve().then(loadAllData);
    }
  }, [isAuthenticated, loadAllData]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;

    try {
      setIsAuthenticating(true);
      setAuthError('');
      const res = await api.admin.login(passwordInput);
      if (res.success) {
        setPasswordInput('');
        setIsAuthenticated(true);
        showNotification('Authenticated as Dealership Administrator');
      } else {
        setAuthError('That password was not recognised. Please try again.');
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to sign in. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    if (websiteDirty && !confirm('You have unpublished website changes. Discard them and sign out?')) return;
    try {
      assertSuccess(await api.admin.logout());
      setIsAuthenticated(false);
      setPasswordInput('');
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Unable to sign out.', 'error');
    }
  };

  // Vehicle Actions
  const handleOpenAddVehicle = () => {
    setEditingVehicle(null);
    setVehicleFormData({
      title: '',
      brand: '',
      model: '',
      year: '', price: '', mileage: '', fuelType: '', transmission: '', bodyType: '', condition: '',
      inspectionScore: '', color: '', location: '', status: '', featured: false, images: '', features: '', description: '',
    });
    setVehiclePhotos([]);
    setIsVehicleModalOpen(true);
  };

  const handleOpenEditVehicle = (veh: Vehicle) => {
    setEditingVehicle(veh);
    setVehicleFormData({
      title: veh.title,
      brand: veh.brand,
      model: veh.model,
      year: String(veh.year),
      price: String(veh.price),
      mileage: String(veh.mileage),
      fuelType: veh.fuelType,
      transmission: veh.transmission,
      bodyType: veh.bodyType,
      condition: veh.condition,
      inspectionScore: String(veh.inspectionScore),
      color: veh.color,
      location: veh.location,
      status: veh.status,
      featured: veh.featured,
      images: veh.images.join(', '),
      features: veh.features.join(', '),
      description: veh.description,
    });
    setVehiclePhotos([]);
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dialogClosing.current) return;
    setIsSaving(true);
    try {
      const imagesArray = vehicleFormData.images
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const featuresArray = vehicleFormData.features
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        title: vehicleFormData.title,
        brand: vehicleFormData.brand,
        model: vehicleFormData.model,
        year: Number(vehicleFormData.year),
        price: Number(vehicleFormData.price),
        mileage: Number(vehicleFormData.mileage) || 0,
        fuelType: vehicleFormData.fuelType || 'petrol',
        transmission: vehicleFormData.transmission || 'automatic',
        bodyType: vehicleFormData.bodyType || 'sedan',
        condition: vehicleFormData.condition || 'used',
        inspectionScore: Number(vehicleFormData.inspectionScore) || 0,
        color: vehicleFormData.color,
        location: vehicleFormData.location,
        status: vehicleFormData.status || 'available',
        featured: Boolean(vehicleFormData.featured),
        images: imagesArray,
        features: featuresArray,
        description: vehicleFormData.description,
      };

      if (editingVehicle) {
        await api.vehicles.update(editingVehicle.id, payload, vehiclePhotos);
        showNotification(`Vehicle "${payload.title}" updated successfully`);
      } else {
        await api.vehicles.create(payload, vehiclePhotos);
        showNotification(`New vehicle "${payload.title}" added to inventory`);
      }

      closeVehicleDialog(true);
      void Promise.resolve().then(loadAllData);
    } catch (err) {
      showNotification((err as Error).message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVehicle = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    try {
      await api.vehicles.delete(id);
      showNotification(`Vehicle "${title}" removed from inventory`);
      void Promise.resolve().then(loadAllData);
    } catch (err) {
      showNotification((err as Error).message, 'error');
    }
  };

  const handleToggleFeatured = async (veh: Vehicle) => {
    try {
      await api.vehicles.update(veh.id, { featured: !veh.featured });
      showNotification(
        `"${veh.title}" is now ${!veh.featured ? 'Featured' : 'Standard'}`
      );
      void Promise.resolve().then(loadAllData);
    } catch (err) {
      showNotification((err as Error).message, 'error');
    }
  };

  const handleToggleStatus = async (
    veh: Vehicle,
    newStatus: Vehicle['status']
  ) => {
    try {
      await api.vehicles.update(veh.id, { status: newStatus });
      showNotification(`Status updated to "${newStatus}"`);
      void Promise.resolve().then(loadAllData);
    } catch (err) {
      showNotification((err as Error).message, 'error');
    }
  };

  // Inspection Actions
  const handleUpdateInspectionStatus = async (
    id: string,
    status: InspectionBooking['status']
  ) => {
    try {
      await api.inspections.updateStatus(id, status);
      showNotification(`Inspection status updated to ${status}`);
      void Promise.resolve().then(loadAllData);
    } catch (err) {
      showNotification((err as Error).message, 'error');
    }
  };

  const handleDeleteInspection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inspection booking?')) return;
    try {
      await api.admin.deleteInspection(id);
      showNotification('Inspection booking deleted');
      void Promise.resolve().then(loadAllData);
    } catch (err) {
      showNotification((err as Error).message, 'error');
    }
  };

  // Inquiry Actions
  const handleUpdateInquiryStatus = async (id: string, status: CustomerInquiry['status']) => {
    try {
      await api.inquiries.updateStatus(id, status);
      setInquiries((items) => items.map((inquiry) => inquiry.id === id ? { ...inquiry, status } : inquiry));
      showNotification(`Inquiry marked as ${readable(status).toLowerCase()}.`);
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Unable to update this inquiry.', 'error');
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inquiry?')) return;
    try {
      await api.admin.deleteInquiry(id);
      showNotification('Inquiry deleted');
      void Promise.resolve().then(loadAllData);
    } catch (err) {
      showNotification((err as Error).message, 'error');
    }
  };

  // Sell Request Actions
  const handleUpdateSellRequestStatus = async (id: string, status: string) => {
    try {
      await api.admin.updateSellRequest(id, status);
      showNotification(`Sell request updated to ${status}`);
      void Promise.resolve().then(loadAllData);
    } catch (err) {
      showNotification((err as Error).message, 'error');
    }
  };

  const handleDeleteSellRequest = async (id: string) => {
    if (!confirm('Delete this sell request?')) return;
    try {
      await api.admin.deleteSellRequest(id);
      showNotification('Sell request deleted');
      void Promise.resolve().then(loadAllData);
    } catch (err) {
      showNotification((err as Error).message, 'error');
    }
  };

  // Find Request Actions
  const handleUpdateFindRequestStatus = async (id: string, status: string) => {
    try {
      await api.admin.updateFindRequest(id, status);
      showNotification(`Car finder request updated to ${status}`);
      void Promise.resolve().then(loadAllData);
    } catch (err) {
      showNotification((err as Error).message, 'error');
    }
  };

  const handleDeleteFindRequest = async (id: string) => {
    if (!confirm('Delete this request?')) return;
    try {
      await api.admin.deleteFindRequest(id);
      showNotification('Find request deleted');
      void Promise.resolve().then(loadAllData);
    } catch (err) {
      showNotification((err as Error).message, 'error');
    }
  };

  // Custom Theme Save
  const handleCreateCustomTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const id = `custom-${customThemeForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    const newTheme: Theme = {
      id,
      name: customThemeForm.name,
      category: customThemeForm.category,
      description: customThemeForm.description,
      background: customThemeForm.background,
      foreground: customThemeForm.foreground,
      card_bg: customThemeForm.card_bg,
      border_color: customThemeForm.border_color,
      primary: customThemeForm.primary,
      accent: customThemeForm.accent,
      glow_color: customThemeForm.glow_color,
      is_active: true,
    };

    const ok = await saveCustomTheme(newTheme);
    if (ok) {
      showNotification(`Custom theme "${newTheme.name}" created and applied!`);
      void Promise.resolve().then(loadAllData);
    } else {
      showNotification('Failed to create custom theme', 'error');
    }
    setIsSaving(false);
  };

  const handleSelectTheme = async (theme: Theme) => {
    setIsSaving(true);
    try {
      await setTheme(theme.id);
      showNotification(`“${theme.name}” saved as the selected theme.`);
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Unable to save your theme selection.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalInventory = vehicles.length;
    const available = vehicles.filter((v) => v.status === 'available').length;
    const totalValuation = vehicles.reduce((sum, v) => sum + v.price, 0);
    const pendingInspections = inspections.filter(
      (i) => i.status === 'pending' || i.status === 'confirmed'
    ).length;
    const pendingSellRequests = sellRequests.length;
    const unreadInquiries = inquiries.filter((q) => q.status === 'new').length;

    return {
      totalInventory,
      available,
      totalValuation,
      pendingInspections,
      pendingSellRequests,
      unreadInquiries,
    };
  }, [vehicles, inspections, sellRequests, inquiries]);

  // Filtered vehicles for inventory view
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (vehicleBrandFilter !== 'all' && v.brand !== vehicleBrandFilter)
        return false;
      if (vehicleStatusFilter !== 'all' && v.status !== vehicleStatusFilter)
        return false;
      if (vehicleSearch.trim()) {
        const q = vehicleSearch.toLowerCase().trim();
        const matches =
          v.title.toLowerCase().includes(q) ||
          v.brand.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [vehicles, vehicleBrandFilter, vehicleStatusFilter, vehicleSearch]);

  const uniqueBrands = useMemo(() => {
    const set = new Set<string>();
    vehicles.forEach((v) => set.add(v.brand));
    return ['all', ...Array.from(set)];
  }, [vehicles]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, count: undefined, detail: 'Your showroom, at a glance.' },
    { id: 'vehicles', label: 'Vehicle inventory', icon: Car, count: vehicles.length, detail: 'Curate the cars your customers will love.' },
    { id: 'inspections', label: 'Inspections', icon: ClipboardCheck, count: inspections.length, detail: 'Keep every appointment moving forward.' },
    { id: 'sell_requests', label: 'Sell requests', icon: DollarSign, count: sellRequests.length, detail: 'Review incoming cars and guide each seller.' },
    { id: 'find_requests', label: 'Car finder', icon: Search, count: findRequests.length, detail: 'Connect every buyer with the right car.' },
    { id: 'inquiries', label: 'Customer inquiries', icon: MessageSquare, count: inquiries.length, detail: 'The start of your next customer relationship.' },
    { id: 'themes', label: 'Theme studio', icon: Palette, count: undefined, detail: 'Manage your showroom theme preferences.' },
    { id: 'settings', label: 'Website editor', icon: Settings, count: undefined, detail: 'Manage services, prices, contact details and website content.' },
  ] as const;
  const selectedTab = tabs.find((tab) => tab.id === activeTab)!;
  const vehicleStatuses = ['available', 'reserved', 'sold'] as const;

  if (isCheckingSession) return <div className={styles.sessionLoading}><BrandLogo /><RefreshCw size={22} className={styles.spin} /><p>Preparing your showroom studio…</p></div>;

  if (!isAuthenticated) return (
    <div ref={adminRoot} className={styles.login}>
      <div className={styles.loginStory}><Link href="/" aria-label="Parakh Motors home"><BrandLogo inverse /></Link><div><span className={styles.eyebrow}>THE PARAKH MOTORS STUDIO</span><h1>Great service.<br />Starts here.</h1><p>A considered space to manage your cars, connect with customers, and keep your business moving.</p></div><div className={styles.loginPromise}><Shield size={20} /><span>Your showroom. Your control.</span></div></div>
      <main className={styles.loginMain}><Link href="/" className={styles.backLink}><ArrowLeft size={17} />Back to the website</Link><div className={styles.loginForm}><div className={styles.loginIcon}><Lock size={25} /></div><span className={styles.eyebrow}>ADMINISTRATOR ACCESS</span><h2>Welcome back.</h2><p>Sign in to manage the Parakh Motors experience.</p><form onSubmit={handleLogin}><Field label="Administrator password"><input className={styles.control} type="password" autoComplete="current-password" required placeholder="Enter your password" value={passwordInput} onChange={(e) => { setPasswordInput(e.target.value); setAuthError(''); }} aria-invalid={Boolean(authError)} aria-describedby={authError ? 'admin-auth-error' : undefined} autoFocus /></Field>{authError && <p id="admin-auth-error" className={styles.formError} role="alert"><AlertCircle size={17} />{authError}</p>}<button data-motion-press className={styles.primaryButton} type="submit" disabled={isAuthenticating}>{isAuthenticating ? <><RefreshCw className={styles.spin} size={17} />Signing in…</> : <>Enter the studio<ArrowUpRight size={19} /></>}</button></form><div className={styles.loginFine}><Shield size={15} /><span>Secure access for the dealership team.</span></div></div></main>
    </div>
  );

  return <div ref={adminRoot} className={styles.app}>
    <aside className={styles.sidebar}><Link href="/" className={styles.sidebarLogo} aria-label="Parakh Motors home" onClick={(event) => { if (websiteDirty && !confirm('Discard unpublished website changes and leave the editor?')) event.preventDefault(); }}><BrandLogo inverse /></Link><span className={styles.sidebarCaption}>SHOWROOM STUDIO</span><nav className={styles.navigation} aria-label="Admin sections">{tabs.map((tab) => { const Icon = tab.icon; return <button data-motion-press key={tab.id} className={`${styles.navItem} ${activeTab === tab.id ? styles.navActive : ''}`} aria-current={activeTab === tab.id ? 'page' : undefined} onClick={() => { if (tab.id === activeTab || (websiteDirty && !confirm('Discard unpublished website changes and switch sections?'))) return; setActiveTab(tab.id); }}><Icon size={19} /><span>{tab.label}</span>{tab.count !== undefined && <span className={styles.navCount}>{tab.count}</span>}</button>; })}</nav><div className={styles.sidebarBottom}><div className={styles.teamAvatar}>PM</div><div><strong>Parakh Motors</strong><span>Administrator</span></div><button data-motion-press onClick={handleLogout} aria-label="Sign out" title="Sign out"><LogOut size={19} /></button></div></aside>
    <div className={styles.workspace}><header className={styles.topbar}><div><span>Parakh Motors</span><span className={styles.breadcrumbSlash}>/</span><strong>{selectedTab.label}</strong></div><div className={styles.topbarActions}><button data-motion-press className={styles.iconButton} onClick={loadAllData} disabled={isLoading || websiteDirty} aria-label="Refresh showroom information" title={websiteDirty ? 'Save or discard your website changes before refreshing' : 'Refresh information'}><RefreshCw size={18} className={isLoading ? styles.spin : ''} /></button><Link href="/" target="_blank" rel="noopener noreferrer" className={styles.secondaryButton}><span>View website</span><ExternalLink size={16} /></Link></div></header>
      <main ref={adminMain} className={styles.main} aria-busy={isLoading}><div data-admin-heading className={styles.pageHeading}><div><span className={styles.eyebrow}>YOUR BUSINESS, BEAUTIFULLY ORGANIZED</span><h1>{selectedTab.label}</h1><p>{selectedTab.detail}</p></div>{activeTab === 'vehicles' && <button data-motion-press className={styles.primaryButton} onClick={handleOpenAddVehicle}><Plus size={18} />Add a vehicle</button>}</div>
        {loadError && <div className={styles.errorBanner} role="alert"><AlertCircle size={20} /><div><strong>We could not load the latest information.</strong><p>{loadError}</p></div><button data-motion-press className={styles.secondaryButton} onClick={loadAllData} disabled={isLoading || websiteDirty}>Try again</button></div>}
        {isLoading && <div className={styles.loadingBar} role="status"><RefreshCw size={15} className={styles.spin} />Updating your showroom…</div>}

        {activeTab === 'overview' && <div data-admin-panel className={styles.sectionStack}><div className={styles.metrics}>{[
          { label: 'Vehicles in inventory', value: metrics.totalInventory, detail: `${metrics.available} available for their next owner`, icon: Car },
          { label: 'Total inventory value', value: formatPKR(metrics.totalValuation), detail: 'Across your complete collection', icon: DollarSign },
          { label: 'Upcoming inspections', value: metrics.pendingInspections, detail: 'Pending and confirmed appointments', icon: ClipboardCheck },
          { label: 'New customer inquiries', value: metrics.unreadInquiries, detail: 'Ready for a personal response', icon: MessageSquare },
        ].map((metric) => <article data-admin-item key={metric.label} className={styles.metric}><div><span>{metric.label}</span><metric.icon size={19} /></div><strong>{metric.value}</strong><p>{metric.detail}</p></article>)}</div><section className={styles.welcomeCard}><div><span className={styles.eyebrow}>A LITTLE CARE GOES A LONG WAY</span><h2>Make the next great match.</h2><p>Bring a new car into the collection, or pick up where your customers left off.</p></div><button data-motion-press className={styles.limeButton} onClick={handleOpenAddVehicle}>Add to the collection<Plus size={19} /></button><Car className={styles.welcomeCar} size={180} strokeWidth={0.8} /></section><div className={styles.twoColumns}>
          <section className={styles.panel}><div className={styles.panelHeader}><h2>Upcoming inspections</h2><button data-motion-press className={styles.textButton} onClick={() => setActiveTab('inspections')}>View all<ArrowUpRight size={16} /></button></div><div className={styles.activityList}>{inspections.slice(0, 4).map((booking) => <div key={booking.id} className={styles.activity}><div className={styles.activityIcon}><ClipboardCheck size={20} /></div><div className={styles.activityBody}><strong>{booking.carMake} {booking.carModel}</strong><span>{booking.customerName} · {booking.city}</span><small>{dateLabel(booking.preferredDate)}{booking.preferredTimeSlot && ` · ${booking.preferredTimeSlot}`}</small></div><Badge status={booking.status} /></div>)}{!inspections.length && <Empty title="A clear calendar" detail="New inspection appointments will appear here." />}</div></section>
          <section className={styles.panel}><div className={styles.panelHeader}><h2>Latest conversations</h2><button data-motion-press className={styles.textButton} onClick={() => setActiveTab('inquiries')}>View all<ArrowUpRight size={16} /></button></div><div className={styles.activityList}>{inquiries.slice(0, 4).map((inquiry) => <div key={inquiry.id} className={styles.activity}><div className={styles.initialAvatar}>{inquiry.name.charAt(0)}</div><div className={styles.activityBody}><strong>{inquiry.name}</strong><span className={styles.messageExcerpt}>{inquiry.message}</span><small>{dateLabel(inquiry.createdAt)}</small></div><Badge status={inquiry.status} /></div>)}{!inquiries.length && <Empty title="All caught up" detail="Customer messages will be waiting here when they arrive." />}</div></section>
        </div></div>}

        {activeTab === 'vehicles' && <div data-admin-panel className={styles.sectionStack}><div className={styles.filters}><label className={styles.searchField}><Search size={18} /><input className={styles.control} aria-label="Search vehicle inventory" placeholder="Search title, make or model" value={vehicleSearch} onChange={(e) => setVehicleSearch(e.target.value)} /></label><select className={styles.control} aria-label="Filter by brand" value={vehicleBrandFilter} onChange={(e) => setVehicleBrandFilter(e.target.value)}>{uniqueBrands.map((brand) => <option key={brand} value={brand}>{brand === 'all' ? 'All makes' : brand}</option>)}</select><select className={styles.control} aria-label="Filter by vehicle status" value={vehicleStatusFilter} onChange={(e) => setVehicleStatusFilter(e.target.value)}><option value="all">All statuses</option>{vehicleStatuses.map((status) => <option key={status} value={status}>{readable(status)}</option>)}</select><span>{filteredVehicles.length} vehicles</span></div><div className={styles.vehicleGrid}>{filteredVehicles.map((vehicle) => <article data-admin-item key={vehicle.id} className={styles.vehicleCard}><div className={styles.vehicleImage}><VehicleImage src={vehicle.images[0] || '/images/parakh-journey.webp'} alt={vehicle.title} width={640} height={400} unoptimized /><div className={styles.vehicleBadges}><Badge status={vehicle.status} />{vehicle.featured && <span className={styles.featuredBadge}>Featured</span>}</div><span className={styles.inspectionScore}><Shield size={14} />{vehicle.inspectionScore}/100</span></div><div className={styles.vehicleBody}><span className={styles.vehicleMeta}>{vehicle.year} · {formatMileage(vehicle.mileage)}</span><h2>{vehicle.title}</h2><strong className={styles.vehiclePrice}>{formatPKR(vehicle.price)}</strong><div className={styles.vehicleSpecs}><span>{readable(vehicle.fuelType)}</span><span>{readable(vehicle.transmission)}</span><span>{readable(vehicle.bodyType)}</span></div><div className={styles.vehicleActions}><button data-motion-press className={`${styles.iconButton} ${vehicle.featured ? styles.featuredActive : ''}`} aria-label={`${vehicle.featured ? 'Remove' : 'Add'} featured status for ${vehicle.title}`} title="Toggle featured status" onClick={() => handleToggleFeatured(vehicle)}><Sparkles size={17} /></button><select className={styles.compactSelect} aria-label={`Status for ${vehicle.title}`} value={vehicle.status} onChange={(e) => handleToggleStatus(vehicle, e.target.value as Vehicle['status'])}>{vehicleStatuses.map((status) => <option key={status} value={status}>{readable(status)}</option>)}</select><button data-motion-press className={styles.iconButton} aria-label={`Edit ${vehicle.title}`} title="Edit vehicle" onClick={() => handleOpenEditVehicle(vehicle)}><Edit3 size={17} /></button><button data-motion-press className={styles.deleteButton} aria-label={`Delete ${vehicle.title}`} title="Delete vehicle" onClick={() => handleDeleteVehicle(vehicle.id, vehicle.title)}><Trash2 size={17} /></button></div></div></article>)}</div>{!filteredVehicles.length && !isLoading && <Empty title="No cars found" detail="Adjust your filters, or add a new vehicle to your collection." />}</div>}

        {activeTab === 'inspections' && <section data-admin-panel className={styles.tablePanel}><div className={styles.tableWrap}><table className={styles.table}><caption className={styles.srOnly}>Inspection appointments</caption><thead><tr>{['Customer', 'Vehicle', 'Package', 'Appointment', 'Fee', 'Status', 'Actions'].map((heading) => <th key={heading} scope="col">{heading}</th>)}</tr></thead><tbody>{inspections.map((booking) => <tr data-admin-item key={booking.id}><td data-label="Customer"><strong>{booking.customerName}</strong><a href={`tel:${booking.phone}`}>{booking.phone}</a><small>{booking.email} · {booking.city}</small></td><td data-label="Vehicle"><strong>{booking.carMake} {booking.carModel}</strong><small>{booking.carYear}</small></td><td data-label="Package">{readable(booking.packageType)}</td><td data-label="Appointment"><span>{dateLabel(booking.preferredDate)}</span><small>{booking.preferredTimeSlot || 'Time to be confirmed'}</small>{booking.locationAddress && <small>{booking.locationAddress}</small>}</td><td data-label="Fee"><strong>{booking.estimatedFee ? formatPKR(booking.estimatedFee) : 'Complimentary'}</strong></td><td data-label="Status"><select className={styles.compactSelect} aria-label={`Inspection status for ${booking.customerName}`} value={booking.status} onChange={(e) => handleUpdateInspectionStatus(booking.id, e.target.value as InspectionBooking['status'])}>{['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((status) => <option key={status} value={status}>{readable(status)}</option>)}</select>{booking.notes && <small>{booking.notes}</small>}</td><td data-label="Actions"><button data-motion-press className={styles.deleteButton} aria-label={`Delete inspection for ${booking.customerName}`} onClick={() => handleDeleteInspection(booking.id)}><Trash2 size={17} /></button></td></tr>)}</tbody></table></div>{!inspections.length && !isLoading && <Empty title="No inspection bookings yet" detail="Appointments made through the website will appear here." />}</section>}

        {activeTab === 'sell_requests' && <section data-admin-panel className={styles.tablePanel}><div className={styles.tableWrap}><table className={styles.table}><caption className={styles.srOnly}>Customer sell requests</caption><thead><tr>{['Seller', 'Vehicle', 'Mileage', 'Asking price', 'Market estimate', 'Status', 'Actions'].map((heading) => <th key={heading} scope="col">{heading}</th>)}</tr></thead><tbody>{sellRequests.map((request) => <tr data-admin-item key={request.id}><td data-label="Seller"><strong>{request.sellerName}</strong><a href={`tel:${request.phone}`}>{request.phone}</a><small>{request.email} · {request.city}</small></td><td data-label="Vehicle"><strong>{request.brand} {request.model}</strong><small>{request.year}</small>{request.conditionDescription && <small>{request.conditionDescription}</small>}<SellRequestPhotos photos={request.photos} vehicleName={`${request.year} ${request.brand} ${request.model}`} /></td><td data-label="Mileage">{formatMileage(request.mileage)}</td><td data-label="Asking price"><strong>{formatPKR(request.expectedPrice)}</strong></td><td data-label="Market estimate">{request.estimatedMarketValueMin ? `${formatPKR(request.estimatedMarketValueMin)} – ${formatPKR(request.estimatedMarketValueMax)}` : 'Awaiting valuation'}</td><td data-label="Status"><select className={styles.compactSelect} aria-label={`Sell request status for ${request.sellerName}`} value={request.status} onChange={(e) => handleUpdateSellRequestStatus(request.id, e.target.value)}>{['received', 'valuation_provided', 'inspection_scheduled', 'listed'].map((status) => <option key={status} value={status}>{readable(status)}</option>)}</select></td><td data-label="Actions"><button data-motion-press className={styles.deleteButton} aria-label={`Delete sell request for ${request.sellerName}`} onClick={() => handleDeleteSellRequest(request.id)}><Trash2 size={17} /></button></td></tr>)}</tbody></table></div>{!sellRequests.length && !isLoading && <Empty title="No seller requests yet" detail="Submitted car valuations will be ready to review here." />}</section>}

        {activeTab === 'find_requests' && <section data-admin-panel className={styles.tablePanel}><div className={styles.tableWrap}><table className={styles.table}><caption className={styles.srOnly}>Personal car finder requests</caption><thead><tr>{['Buyer', 'Desired car', 'Minimum year', 'Budget', 'Notes', 'Status', 'Actions'].map((heading) => <th key={heading} scope="col">{heading}</th>)}</tr></thead><tbody>{findRequests.map((request) => <tr data-admin-item key={request.id}><td data-label="Buyer"><strong>{request.buyerName}</strong><a href={`tel:${request.phone}`}>{request.phone}</a><small>{request.email} · {request.preferredCity}</small></td><td data-label="Desired car"><strong>{request.targetBrand} {request.targetModel}</strong></td><td data-label="Minimum year">{request.minYear}+</td><td data-label="Budget"><strong>{formatPKR(request.budgetMax)}</strong></td><td data-label="Notes">{request.notes || 'No additional notes'}</td><td data-label="Status"><select className={styles.compactSelect} aria-label={`Car finder status for ${request.buyerName}`} value={request.status} onChange={(e) => handleUpdateFindRequestStatus(request.id, e.target.value)}>{['active', 'options_found', 'fulfilled', 'closed'].map((status) => <option key={status} value={status}>{readable(status)}</option>)}</select></td><td data-label="Actions"><button data-motion-press className={styles.deleteButton} aria-label={`Delete car finder request for ${request.buyerName}`} onClick={() => handleDeleteFindRequest(request.id)}><Trash2 size={17} /></button></td></tr>)}</tbody></table></div>{!findRequests.length && !isLoading && <Empty title="No car finder requests yet" detail="Your customers’ wish lists will appear here." />}</section>}

        {activeTab === 'inquiries' && <div data-admin-panel className={styles.inquiryGrid}>{inquiries.map((inquiry) => <article data-admin-item key={inquiry.id} className={styles.inquiryCard}><div className={styles.inquiryHeader}><div className={styles.initialAvatar}>{inquiry.name.charAt(0)}</div><div><h2>{inquiry.name}</h2><span>{readable(inquiry.type)} inquiry</span></div><select className={styles.compactSelect} aria-label={`Inquiry status for ${inquiry.name}`} value={inquiry.status} onChange={(e) => handleUpdateInquiryStatus(inquiry.id, e.target.value as CustomerInquiry['status'])}>{['new', 'in_review', 'contacted', 'resolved'].map((status) => <option key={status} value={status}>{readable(status)}</option>)}</select></div><p className={styles.inquiryMessage}>{inquiry.message}</p><div className={styles.contactDetails}><a href={`tel:${inquiry.phone}`}>{inquiry.phone}</a><a href={`mailto:${inquiry.email}`}>{inquiry.email}</a></div><div className={styles.inquiryFooter}><span>{dateLabel(inquiry.createdAt)}</span><button data-motion-press className={styles.deleteTextButton} onClick={() => handleDeleteInquiry(inquiry.id)}><Trash2 size={15} />Delete</button></div></article>)}{!inquiries.length && !isLoading && <Empty title="No conversations yet" detail="Inquiries and test drive messages will appear here." />}</div>}

        {activeTab === 'themes' && <div data-admin-panel className={styles.sectionStack}><div className={styles.themeGrid}>{themes.map((theme) => <article data-admin-item className={`${styles.themeCard} ${currentTheme.id === theme.id ? styles.selectedTheme : ''}`} key={theme.id}><div className={styles.themePreview} style={{ background: themePreviews[theme.id]['--pm-paper'], color: themePreviews[theme.id]['--pm-ink'] }}><span className={styles.previewLine} style={{ background: theme.primary }} /><div className={styles.previewCard} style={{ background: themePreviews[theme.id]['--pm-surface'], borderColor: theme.border_color }}><Car size={28} strokeWidth={1.3} /><strong>A better drive.</strong><span style={{ background: theme.primary, color: themePreviews[theme.id]['--pm-button-text'] }}>Explore the collection<ArrowUpRight size={13} /></span></div><div className={styles.swatches}>{[theme.background, theme.foreground, theme.primary, theme.accent].map((color, index) => <span key={index} style={{ background: color }} title={color} />)}</div></div><div className={styles.themeBody}><span>{theme.category}</span><h2>{theme.name}</h2><p>{theme.description}</p><div className={styles.themeActions}><button data-motion-press className={currentTheme.id === theme.id ? styles.secondaryButton : styles.primaryButton} disabled={currentTheme.id === theme.id || isSaving} onClick={() => handleSelectTheme(theme)}>{currentTheme.id === theme.id ? <><Check size={16} />Selected theme</> : <>Select theme<ArrowUpRight size={16} /></>}</button>{theme.id.startsWith('custom-') && <button data-motion-press className={styles.deleteButton} aria-label={`Delete theme ${theme.name}`} disabled={isSaving} onClick={async () => { if (!confirm(`Delete custom theme “${theme.name}”?`)) return; setIsSaving(true); const deleted = await deleteCustomTheme(theme.id); showNotification(deleted ? 'Custom theme deleted.' : 'Unable to delete this theme.', deleted ? 'success' : 'error'); setIsSaving(false); }}><Trash2 size={17} /></button>}</div></div></article>)}</div><section className={styles.panel}><div className={styles.panelHeader}><div><h2>Create a custom theme</h2><p>A personal palette, with every detail under your control.</p></div><Sparkles size={23} /></div><form className={styles.settingsForm} onSubmit={handleCreateCustomTheme}><div className={styles.formGrid}>{(['name', 'category', 'description'] as const).map((key) => <Field key={key} label={readable(key)} wide={key === 'description'}><input className={styles.control} required={key !== 'description'} value={customThemeForm[key]} onChange={(e) => setCustomThemeForm({ ...customThemeForm, [key]: e.target.value })} /></Field>)}{(['background', 'foreground', 'primary', 'accent'] as const).map((key) => <Field key={key} label={readable(key)}><div className={styles.colorField}><input type="color" aria-label={`${readable(key)} color picker`} value={/^#[0-9a-f]{6}$/i.test(customThemeForm[key]) ? customThemeForm[key] : '#153e35'} onChange={(e) => setCustomThemeForm({ ...customThemeForm, [key]: e.target.value })} /><input className={styles.control} aria-label={`${readable(key)} color value`} value={customThemeForm[key]} onChange={(e) => setCustomThemeForm({ ...customThemeForm, [key]: e.target.value })} /></div></Field>)}{(['card_bg', 'border_color', 'glow_color'] as const).map((key) => <Field key={key} label={readable(key)}><input className={styles.control} value={customThemeForm[key]} onChange={(e) => setCustomThemeForm({ ...customThemeForm, [key]: e.target.value })} /></Field>)}</div><div className={styles.formFooter}><p>Your new theme is selected when saved.</p><button data-motion-press className={styles.primaryButton} disabled={isSaving} type="submit">{isSaving ? <RefreshCw className={styles.spin} size={17} /> : <Check size={17} />}{isSaving ? 'Saving…' : 'Save custom theme'}</button></div></form></section></div>}

        {activeTab === 'settings' && <div data-admin-panel className={styles.sectionStack}><section className={styles.connectionCard}><div className={styles.activityIcon}><Database size={23} /></div><div><h2>Website management</h2><p>{dbStatus?.db_connected ? 'Changes publish to your website and are saved in Supabase.' : 'Check the database connection before publishing changes.'}</p></div>{dbStatus && <Badge status={dbStatus.db_connected ? 'connected' : 'unavailable'} />}</section>{dealershipSettings ? <AdminWebsiteEditor settings={dealershipSettings} onDirtyChange={setWebsiteDirty} onSaved={(saved) => { settingsRevision.current += 1; setDealershipSettings(saved); showNotification('Website content and prices published'); }} onError={(message) => showNotification(message, 'error')} /> : !isLoading && <Empty title="Settings are unavailable" detail="Refresh the showroom information to try again." />}</div>}
        <footer className={styles.workspaceFooter}><span>Parakh Motors · Showroom Studio</span><span>Care in every detail.</span></footer>
      </main>
    </div>
    {notification && <div ref={toast} className={`${styles.toast} ${notification.type === 'error' ? styles.toastError : ''}`} role={notification.type === 'error' ? 'alert' : 'status'}>{notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}<span>{notification.message}</span><button data-motion-press onClick={() => setNotification(null)} aria-label="Dismiss notification"><X size={17} /></button></div>}
    <dialog ref={vehicleDialog} className={styles.dialog} aria-labelledby="vehicle-dialog-title" onCancel={(event) => { event.preventDefault(); closeVehicleDialog(); }} onClick={(e) => { if (e.target === e.currentTarget) closeVehicleDialog(); }}>
      <div className={styles.dialogHeader}><div><span className={styles.eyebrow}>THE PARAKH COLLECTION</span><h2 id="vehicle-dialog-title">{editingVehicle ? 'Refine the details.' : 'A new addition.'}</h2><p>{editingVehicle ? 'Update this vehicle’s information and listing.' : 'Give your next great car a place in the showroom.'}</p></div><button data-motion-press className={styles.iconButton} onClick={() => closeVehicleDialog()} disabled={isSaving} aria-label="Close vehicle form"><X size={20} /></button></div>
      <form onSubmit={handleSaveVehicle} className={styles.vehicleForm}><div className={styles.formGrid}><Field label="Listing title *" wide><input className={styles.control} required placeholder="e.g. Mercedes-Benz E200 AMG Line" value={vehicleFormData.title} onChange={(e) => setVehicleFormData({ ...vehicleFormData, title: e.target.value })} /></Field><Field label="Make *"><input className={styles.control} required placeholder="e.g. Toyota" value={vehicleFormData.brand} onChange={(e) => setVehicleFormData({ ...vehicleFormData, brand: e.target.value })} /></Field><Field label="Model *"><input className={styles.control} required placeholder="e.g. Corolla" value={vehicleFormData.model} onChange={(e) => setVehicleFormData({ ...vehicleFormData, model: e.target.value })} /></Field>{([['year', 'Model year *', 1900, 2030], ['price', 'Price (PKR) *', 1, undefined], ['mileage', 'Mileage (km)', 0, undefined], ['inspectionScore', 'Inspection score (0–100)', 0, 100]] as const).map(([key, label, min, max]) => <Field key={key} label={label}><input className={styles.control} type="number" required={key === 'year' || key === 'price'} min={min} max={max} value={vehicleFormData[key]} onChange={(e) => setVehicleFormData({ ...vehicleFormData, [key]: e.target.value })} /></Field>)}
        <Field label="Fuel type"><select className={styles.control} value={vehicleFormData.fuelType} onChange={(e) => setVehicleFormData({ ...vehicleFormData, fuelType: e.target.value as Vehicle['fuelType'] | '' })}><option value="">Choose fuel type</option>{['petrol', 'diesel', 'hybrid', 'electric'].map((value) => <option key={value} value={value}>{readable(value)}</option>)}</select></Field><Field label="Transmission"><select className={styles.control} value={vehicleFormData.transmission} onChange={(e) => setVehicleFormData({ ...vehicleFormData, transmission: e.target.value as Vehicle['transmission'] | '' })}><option value="">Choose transmission</option>{['automatic', 'manual'].map((value) => <option key={value} value={value}>{readable(value)}</option>)}</select></Field><Field label="Body style"><select className={styles.control} value={vehicleFormData.bodyType} onChange={(e) => setVehicleFormData({ ...vehicleFormData, bodyType: e.target.value as Vehicle['bodyType'] | '' })}><option value="">Choose body style</option>{['sedan', 'suv', 'crossover', 'coupe', 'hatchback'].map((value) => <option key={value} value={value}>{readable(value)}</option>)}</select></Field><Field label="Condition"><select className={styles.control} value={vehicleFormData.condition} onChange={(e) => setVehicleFormData({ ...vehicleFormData, condition: e.target.value as Vehicle['condition'] | '' })}><option value="">Choose condition</option>{['certified_pre_owned', 'used', 'brand_new'].map((value) => <option key={value} value={value}>{readable(value)}</option>)}</select></Field><Field label="Listing status"><select className={styles.control} value={vehicleFormData.status} onChange={(e) => setVehicleFormData({ ...vehicleFormData, status: e.target.value as Vehicle['status'] | '' })}><option value="">Choose status</option>{vehicleStatuses.map((value) => <option key={value} value={value}>{readable(value)}</option>)}</select></Field><Field label="Exterior color"><input className={styles.control} value={vehicleFormData.color} onChange={(e) => setVehicleFormData({ ...vehicleFormData, color: e.target.value })} /></Field><Field label="Location"><input className={styles.control} value={vehicleFormData.location} onChange={(e) => setVehicleFormData({ ...vehicleFormData, location: e.target.value })} /></Field><Field label="Image links (separate with commas)" wide><textarea className={styles.control} rows={2} placeholder="Paste image links here" value={vehicleFormData.images} onChange={(e) => setVehicleFormData({ ...vehicleFormData, images: e.target.value })} /></Field><AdminVehiclePhotoUpload key={`${editingVehicle?.id ?? 'new'}-${isVehicleModalOpen}`} onChange={setVehiclePhotos} disabled={isSaving} /><Field label="Features (separate with commas)" wide><input className={styles.control} placeholder="Sunroof, 360 camera, Leather seats" value={vehicleFormData.features} onChange={(e) => setVehicleFormData({ ...vehicleFormData, features: e.target.value })} /></Field><Field label="Description" wide><textarea className={styles.control} rows={4} value={vehicleFormData.description} onChange={(e) => setVehicleFormData({ ...vehicleFormData, description: e.target.value })} /></Field><label className={styles.checkboxField}><input type="checkbox" checked={vehicleFormData.featured} onChange={(e) => setVehicleFormData({ ...vehicleFormData, featured: e.target.checked })} /><span>Feature this vehicle on the website</span></label>
      </div><div className={styles.formFooter}><button data-motion-press className={styles.secondaryButton} type="button" onClick={() => closeVehicleDialog()} disabled={isSaving}>Cancel</button><button data-motion-press className={styles.primaryButton} type="submit" disabled={isSaving}>{isSaving ? <RefreshCw size={17} className={styles.spin} /> : <Check size={17} />}{isSaving ? 'Saving…' : editingVehicle ? 'Save vehicle' : 'Add to inventory'}</button></div></form>
    </dialog>
  </div>;
}


