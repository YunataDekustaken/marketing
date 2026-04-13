/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, ChangeEvent, Dispatch, SetStateAction } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  Edit2, 
  Trash2, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  X,
  Loader2,
  Undo2,
  Redo2,
  Image as ImageIcon,
  Upload,
  Eye,
  LayoutList,
  Columns,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  GripVertical,
  Lock,
  Unlock,
  Bell,
  Home,
  ClipboardList,
  BarChart3,
  Settings,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Post, PostStatus, ViewMode, INITIAL_POSTS } from './types';
import { generateCaption } from './services/geminiService';
import { CONTENT_TITLES, CONTENT_TYPES, FORMATS, FUNNEL_STATUSES } from './constants';
import { auth, db, googleProvider } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  getDocFromServer
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

type ColumnId = keyof Post | 'ai';

interface TableColumn {
  id: ColumnId;
  label: string;
  width: string;
  visible: boolean;
}

const STATUS_COLORS: Record<PostStatus, string> = {
  'Not Started': 'bg-slate-100 text-slate-600 border-slate-200',
  'In Progress': 'bg-blue-50 text-blue-600 border-blue-100',
  'Ready for Review': 'bg-amber-50 text-amber-600 border-amber-100',
  'Scheduled': 'bg-emerald-50 text-emerald-600 border-emerald-100',
};

const STATUS_ICONS: Record<PostStatus, any> = {
  'Not Started': AlertCircle,
  'In Progress': Clock,
  'Ready for Review': Edit2,
  'Scheduled': CheckCircle2,
};

interface KanbanViewProps {
  filteredPosts: Post[];
  setFormData: Dispatch<SetStateAction<Partial<Post>>>;
  handleOpenModal: (post?: Post) => void;
}

const KanbanView: React.FC<KanbanViewProps> = ({ filteredPosts, setFormData, handleOpenModal }) => {
  const statuses: PostStatus[] = ['Not Started', 'In Progress', 'Ready for Review', 'Scheduled'];
  
  return (
    <div className="flex gap-6 overflow-x-auto pb-6 min-h-[600px]">
      {statuses.map(status => {
        const statusPosts = filteredPosts.filter(p => p.status === status);
        const StatusIcon = STATUS_ICONS[status];
        
        return (
          <div key={status} className="flex-shrink-0 w-80 flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className={`p-1 rounded-md border ${STATUS_COLORS[status]}`}>
                  <StatusIcon className="w-4 h-4" />
                </span>
                <h3 className="font-semibold text-slate-700">{status}</h3>
                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {statusPosts.length}
                </span>
              </div>
              <button 
                onClick={() => {
                  setFormData(prev => ({ ...prev, status }));
                  handleOpenModal();
                }}
                className="p-1 hover:bg-slate-200 rounded-md text-slate-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              {statusPosts.map(post => (
                <motion.div 
                  layout
                  key={post.id}
                  onClick={() => handleOpenModal(post)}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded">
                      {post.contentTitle}
                    </span>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {format(new Date(post.date), 'MMM d')}
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 mb-2 line-clamp-2">
                    {post.topicTheme || "Untitled Content"}
                  </h4>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-1.5">
                      {post.creatives?.slice(0, 3).map((c, i) => (
                        <div key={i} className="h-6 w-6 rounded-full border-2 border-white overflow-hidden bg-slate-100">
                          <img src={c} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {post.format}
                    </div>
                  </div>
                </motion.div>
              ))}
              {statusPosts.length === 0 && (
                <div className="h-24 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center text-slate-300 text-xs italic">
                  No posts here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface CalendarViewProps {
  currentMonth: Date;
  posts: Post[];
  handleCreateForDate: (dateStr: string) => Promise<Post | null>;
  handleOpenModal: (post?: Post) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ currentMonth, posts, handleCreateForDate, handleOpenModal }) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {weekDays.map(day => (
          <div key={day} className="px-2 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-[120px]">
        {calendarDays.map((day, idx) => {
          const dayPosts = posts.filter(p => isSameDay(new Date(p.date), day));
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());

          return (
            <div 
              key={idx} 
              className={`border-r border-b border-slate-100 p-2 flex flex-col gap-1 overflow-hidden transition-colors ${!isCurrentMonth ? 'bg-slate-50/50' : 'bg-white'} ${isToday ? 'bg-amber-50/30' : ''} group`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${!isCurrentMonth ? 'text-slate-300' : isToday ? 'text-amber-600' : 'text-slate-500'} ${isToday ? 'bg-amber-100 w-6 h-6 flex items-center justify-center rounded-full' : ''}`}>
                  {format(day, 'd')}
                </span>
                {isCurrentMonth && (
                  <button 
                    onClick={async () => {
                      const newPost = await handleCreateForDate(format(day, 'yyyy-MM-dd'));
                      if (newPost) handleOpenModal(newPost);
                    }}
                    className="p-0.5 hover:bg-slate-100 rounded text-slate-300 hover:text-amber-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar">
                {dayPosts.map(post => (
                  <div 
                    key={post.id}
                    onClick={() => handleOpenModal(post)}
                    className={`text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer font-medium border ${STATUS_COLORS[post.status]} hover:brightness-95 transition-all`}
                    title={post.topicTheme}
                  >
                    {post.contentTitle}: {post.topicTheme || "Untitled"}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface MonthlyTableViewProps {
  currentMonth: Date;
  tableColumns: TableColumn[];
  posts: Post[];
  handleUpdatePostInline: (id: string, field: keyof Post, value: any) => void;
  handleCreateForDate: (dateStr: string) => Promise<Post | null>;
  showColumnSettings: boolean;
  setShowColumnSettings: (show: boolean) => void;
  setTableColumns: Dispatch<SetStateAction<TableColumn[]>>;
  toggleColumnVisibility: (id: ColumnId) => void;
  addCustomColumn: () => void;
  sensors: any;
  handleDragEnd: (event: DragEndEvent) => void;
  isColumnsLocked: boolean;
  setIsColumnsLocked: (locked: boolean) => void;
  handleCopy: (text: string, id: string) => void;
  copiedId: string | null;
  setPreviewImage: (url: string | null) => void;
  handleOpenModal: (post?: Post) => void;
  handleDeletePost: (id: string) => void;
  searchQuery?: string;
}

const MonthlyTableView: React.FC<MonthlyTableViewProps> = ({
  currentMonth,
  tableColumns,
  posts,
  handleUpdatePostInline,
  handleCreateForDate,
  showColumnSettings,
  setShowColumnSettings,
  setTableColumns,
  toggleColumnVisibility,
  addCustomColumn,
  sensors,
  handleDragEnd,
  isColumnsLocked,
  setIsColumnsLocked,
  handleCopy,
  copiedId,
  setPreviewImage,
  handleOpenModal,
  handleDeletePost,
  searchQuery = ''
}) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const visibleColumns = tableColumns.filter(c => c.visible);

  // If searching, only show days that have matching posts.
  // Otherwise show all days of the month.
  const days = searchQuery.trim() 
    ? allDays.filter(day => posts.some(p => p.date === format(day, 'yyyy-MM-dd')))
    : allDays;

  const renderCell = (post: Post, colId: ColumnId, day: Date, pIdx: number) => {
    const isToday = isSameDay(day, new Date());
    
    switch (colId) {
      case 'date':
        return pIdx === 0 ? (
          <div className={`text-xs font-bold ${isToday ? 'text-amber-600' : 'text-slate-700'}`}>
            {format(day, 'EEE, MMM d')}
          </div>
        ) : null;
      case 'contentTitle':
        return (
          <select 
            value={post.contentTitle}
            onChange={(e) => handleUpdatePostInline(post.id, 'contentTitle', e.target.value)}
            className="w-full bg-transparent border-none text-sm font-medium text-slate-900 focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 outline-none appearance-none cursor-pointer hover:bg-slate-100"
          >
            {CONTENT_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        );
      case 'contentType':
        return (
          <select 
            value={post.contentType}
            onChange={(e) => handleUpdatePostInline(post.id, 'contentType', e.target.value)}
            className="w-full bg-transparent border-none text-xs text-slate-600 focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 outline-none appearance-none cursor-pointer hover:bg-slate-100"
          >
            {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        );
      case 'topicTheme':
        return (
          <input 
            type="text"
            value={post.topicTheme}
            placeholder="Enter theme..."
            onChange={(e) => handleUpdatePostInline(post.id, 'topicTheme', e.target.value)}
            className="w-full bg-transparent border-none text-sm text-slate-700 focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 outline-none hover:bg-slate-100"
          />
        );
      case 'subtopic':
        return (
          <input 
            type="text"
            value={post.subtopic || ''}
            placeholder="Enter subtopic..."
            onChange={(e) => handleUpdatePostInline(post.id, 'subtopic', e.target.value)}
            className="w-full bg-transparent border-none text-sm text-slate-700 focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 outline-none hover:bg-slate-100"
          />
        );
      case 'caption':
        return (
          <div className="relative group/caption">
            <textarea 
              value={post.caption || ''}
              placeholder="No caption..."
              onChange={(e) => handleUpdatePostInline(post.id, 'caption', e.target.value)}
              rows={1}
              className="w-full bg-transparent border-none text-xs text-slate-600 focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 outline-none hover:bg-slate-100 resize-none min-h-[32px] overflow-hidden line-clamp-2 focus:line-clamp-none focus:min-h-[80px]"
            />
            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/caption:opacity-100 transition-opacity">
              {post.caption && (
                <button 
                  onClick={() => handleCopy(post.caption!, post.id)}
                  className="p-1 bg-white/80 border border-slate-200 rounded shadow-sm hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  title="Copy Caption"
                >
                  {copiedId === post.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
              <button 
                onClick={() => handleOpenModal(post)}
                className="p-1 bg-white/80 border border-slate-200 rounded shadow-sm hover:bg-amber-50 hover:text-amber-600 transition-colors"
                title="AI Generation"
              >
                <Sparkles className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      case 'creatives':
        return post.creatives?.[0] ? (
          <div className="relative group/creative w-12 h-12 rounded border border-slate-200 overflow-hidden bg-slate-50">
            <img 
              src={post.creatives[0]} 
              alt="Creative" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/creative:opacity-100 transition-opacity flex items-center justify-center gap-1">
              <button 
                onClick={() => setPreviewImage(post.creatives![0])}
                className="p-1 text-white hover:text-indigo-300 transition-colors"
              >
                <Eye className="w-3 h-3" />
              </button>
              <button 
                onClick={() => handleOpenModal(post)}
                className="p-1 text-white hover:text-indigo-300 transition-colors"
              >
                <Upload className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => handleOpenModal(post)}
            className="w-12 h-12 rounded border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all"
          >
            <Upload className="w-4 h-4" />
          </button>
        );
      case 'format':
        return (
          <select 
            value={post.format}
            onChange={(e) => handleUpdatePostInline(post.id, 'format', e.target.value)}
            className="w-full bg-transparent border-none text-xs text-slate-600 focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 outline-none appearance-none cursor-pointer hover:bg-slate-100"
          >
            {FORMATS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        );
      case 'status':
        return (
          <select 
            value={post.status}
            onChange={(e) => handleUpdatePostInline(post.id, 'status', e.target.value as PostStatus)}
            className={`w-full bg-transparent border-none text-[10px] font-bold uppercase tracking-wider focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 outline-none appearance-none cursor-pointer hover:bg-slate-100 ${STATUS_COLORS[post.status]}`}
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Ready for Review">Ready for Review</option>
            <option value="Scheduled">Scheduled</option>
          </select>
        );
      case 'funnelStatus':
        return (
          <select 
            value={post.funnelStatus}
            onChange={(e) => handleUpdatePostInline(post.id, 'funnelStatus', e.target.value)}
            className="w-full bg-transparent border-none text-xs text-slate-600 focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 outline-none appearance-none cursor-pointer hover:bg-slate-100"
          >
            {FUNNEL_STATUSES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        );
      case 'visualIdeas':
        return (
          <input 
            type="text"
            value={post.visualIdeas || ''}
            placeholder="Visual ideas..."
            onChange={(e) => handleUpdatePostInline(post.id, 'visualIdeas', e.target.value)}
            className="w-full bg-transparent border-none text-sm text-slate-700 focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 outline-none hover:bg-slate-100"
          />
        );
      default:
        if (colId.toString().startsWith('custom_') || colId.toString() === 'notes') {
          return (
            <input 
              type="text"
              value={(post as any)[colId] || ''}
              placeholder={`Enter ${colId.toString() === 'notes' ? 'notes' : 'text'}...`}
              onChange={(e) => handleUpdatePostInline(post.id, colId as any, e.target.value)}
              className="w-full bg-transparent border-none text-sm text-slate-700 focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 outline-none hover:bg-slate-100"
            />
          );
        }
        return null;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutList className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">Monthly Table</span>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowColumnSettings(!showColumnSettings)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
          >
            <Columns className="w-3.5 h-3.5" />
            Columns
          </button>
          
          <AnimatePresence>
            {showColumnSettings && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-2"
              >
                <div className="flex items-center justify-between p-2 mb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Manage Columns</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setTableColumns([
                        { id: 'date', label: 'Date', width: 'w-32', visible: true },
                        { id: 'creatives', label: 'Creatives', width: 'w-32', visible: true },
                        { id: 'contentTitle', label: 'Content Title', width: 'w-40', visible: true },
                        { id: 'contentType', label: 'Type', width: 'w-40', visible: true },
                        { id: 'topicTheme', label: 'Topic / Theme', width: 'w-64', visible: true },
                        { id: 'subtopic', label: 'Subtopic', width: 'w-48', visible: false },
                        { id: 'caption', label: 'Caption', width: 'w-64', visible: true },
                        { id: 'format', label: 'Format', width: 'w-40', visible: true },
                        { id: 'status', label: 'Status', width: 'w-44', visible: true },
                        { id: 'funnelStatus', label: 'Funnel', width: 'w-40', visible: false },
                        { id: 'visualIdeas', label: 'Visual Ideas', width: 'w-64', visible: false },
                        { id: 'notes', label: 'Notes', width: 'w-64', visible: false },
                      ])}
                      className="text-[10px] font-bold text-indigo-600 hover:underline"
                    >
                      Reset
                    </button>
                    <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsColumnsLocked(!isColumnsLocked)}
                      className={`p-1 rounded transition-colors ${isColumnsLocked ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-400 hover:bg-slate-100'}`}
                      title={isColumnsLocked ? "Unlock Column Order" : "Lock Column Order"}
                    >
                      {isColumnsLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => setShowColumnSettings(false)}><X className="w-3.5 h-3.5 text-slate-400" /></button>
                  </div>
                  </div>
                </div>
                <div className="space-y-1 max-h-80 overflow-y-auto no-scrollbar">
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={tableColumns.map(c => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {tableColumns.map((col) => (
                        <SortableColumnItem 
                          key={col.id.toString()} 
                          col={col} 
                          toggleColumnVisibility={toggleColumnVisibility}
                          setTableColumns={setTableColumns}
                          isLocked={isColumnsLocked}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
                <button 
                  onClick={addCustomColumn}
                  className="w-full mt-2 flex items-center justify-center gap-2 p-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-dashed border-indigo-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add New Column
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToHorizontalAxis]}
      >
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
              <thead>
                <SortableContext 
                  items={visibleColumns.map(c => c.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                    {visibleColumns.map((col) => (
                      <SortableHeader key={col.id.toString()} col={col} isLocked={isColumnsLocked} />
                    ))}
                    <th className="w-24 px-4 py-3 sticky right-0 bg-slate-50/50 border-l border-slate-200">
                    </th>
                  </tr>
                </SortableContext>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {days.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayPosts = posts.filter(p => p.date === dateStr);
                  const isToday = isSameDay(day, new Date());

                  if (dayPosts.length === 0) {
                    return (
                      <tr key={dateStr} className={`group hover:bg-slate-50/50 transition-colors ${isToday ? 'bg-amber-50/20' : ''}`}>
                        {visibleColumns.map((col, idx) => (
                          <td key={col.id} className="px-4 py-3 align-top">
                            {col.id === 'date' ? (
                              <div className={`text-xs font-bold ${isToday ? 'text-amber-600' : 'text-slate-400'}`}>
                                {format(day, 'EEE, MMM d')}
                              </div>
                            ) : idx === 1 ? (
                              <button 
                                onClick={() => handleCreateForDate(dateStr).then(p => p && handleOpenModal(p))}
                                className="text-xs text-slate-300 italic hover:text-amber-500 transition-colors flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                Add content...
                              </button>
                            ) : null}
                          </td>
                        ))}
                        <td className="px-4 py-3 align-top sticky right-0 bg-white group-hover:bg-slate-50/50 transition-colors border-l border-slate-100"></td>
                      </tr>
                    );
                  }

                  return dayPosts.map((post, pIdx) => (
                    <tr key={post.id} className={`group hover:bg-slate-50/50 transition-colors ${isToday ? 'bg-amber-50/20' : ''}`}>
                      {visibleColumns.map((col) => (
                        <td key={col.id} className="px-4 py-3 align-top">
                          {renderCell(post, col.id, day, pIdx)}
                        </td>
                      ))}
                      <td className="px-4 py-3 align-top sticky right-0 bg-white group-hover:bg-slate-50/50 transition-colors border-l border-slate-100">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenModal(post)}
                            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-amber-600 transition-colors"
                            title="Edit Post"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors"
                            title="Delete Post"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
      </DndContext>
    </div>
  );
};

export default function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'All'>('All');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3, 1)); // April 2026 based on initial posts
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [isColumnsLocked, setIsColumnsLocked] = useState(true);
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([
    { id: 'date', label: 'Date', width: 'w-32', visible: true },
    { id: 'creatives', label: 'Creatives', width: 'w-32', visible: true },
    { id: 'contentTitle', label: 'Content Title', width: 'w-40', visible: true },
    { id: 'contentType', label: 'Type', width: 'w-40', visible: true },
    { id: 'topicTheme', label: 'Topic / Theme', width: 'w-64', visible: true },
    { id: 'subtopic', label: 'Subtopic', width: 'w-48', visible: false },
    { id: 'caption', label: 'Caption', width: 'w-64', visible: true },
    { id: 'format', label: 'Format', width: 'w-40', visible: true },
    { id: 'status', label: 'Status', width: 'w-44', visible: true },
    { id: 'funnelStatus', label: 'Funnel', width: 'w-40', visible: false },
    { id: 'visualIdeas', label: 'Visual Ideas', width: 'w-64', visible: false },
    { id: 'notes', label: 'Notes', width: 'w-64', visible: false },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Post>>({
    date: new Date().toISOString().split('T')[0],
    status: 'Not Started',
    contentTitle: CONTENT_TITLES[0],
    contentType: CONTENT_TYPES[0],
    format: FORMATS[0],
    topicTheme: '',
    funnelStatus: FUNNEL_STATUSES[0],
    visualIdeas: '',
    caption: '',
    customPrompt: '',
    creatives: [],
  });

  // Undo/Redo state for caption
  const [captionHistory, setCaptionHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Data Fetching
  useEffect(() => {
    if (!isAuthReady) return;

    // Test connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    // If no user, we show all posts or guest posts. 
    // For "disable login", we'll just fetch all posts for now or use a 'guest' filter.
    const postsRef = collection(db, 'posts');
    const q = user 
      ? query(postsRef, where('userId', '==', user.uid))
      : query(postsRef, where('userId', '==', 'guest_user'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Post[];
      setPosts(postsData);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'posts');
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  const filteredPosts = posts.filter(post => {
    const postDate = new Date(post.date);
    const matchesMonth = isSameMonth(postDate, currentMonth);
    
    const matchesSearch = 
      post.contentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.topicTheme.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    const matchesStatus = statusFilter === 'All' || post.status === statusFilter;
    
    return matchesMonth && matchesSearch && matchesStatus;
  });

  const handleUpdatePostInline = async (id: string, field: keyof Post, value: any) => {
    try {
      const postRef = doc(db, 'posts', id);
      await updateDoc(postRef, { [field]: value });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `posts/${id}`);
    }
  };

  const handleCreateForDate = async (dateStr: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newPost: Post = {
      id,
      date: dateStr,
      status: 'Not Started',
      contentTitle: CONTENT_TITLES[0],
      contentType: CONTENT_TYPES[0],
      format: FORMATS[0],
      topicTheme: '',
      funnelStatus: FUNNEL_STATUSES[0],
      visualIdeas: '',
      caption: '',
      customPrompt: '',
      creatives: [],
      userId: user?.uid || 'guest_user',
    };
    
    try {
      await setDoc(doc(db, 'posts', id), newPost);
      return newPost;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `posts/${id}`);
      return null;
    }
  };

  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleColumnVisibility = (id: ColumnId) => {
    setTableColumns(prev => prev.map(col => 
      col.id === id ? { ...col, visible: !col.visible } : col
    ));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (isColumnsLocked) return;

    if (over && active.id !== over.id) {
      setTableColumns((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addCustomColumn = () => {
    const name = prompt('Enter column name:');
    if (!name) return;
    const id = `custom_${Math.random().toString(36).substr(2, 5)}`;
    setTableColumns(prev => [
      ...prev.slice(0, -1), // Insert before AI column
      { id: id as any, label: name, width: 'w-48', visible: true },
      prev[prev.length - 1]
    ]);
  };

  const handleOpenModal = (post?: Post) => {
    if (post) {
      setEditingPost(post);
      setFormData({ ...post, creatives: post.creatives || [], customPrompt: post.customPrompt || '' });
      setCaptionHistory([post.caption || '']);
      setHistoryIndex(0);
    } else {
      setEditingPost(null);
      const initialData = {
        date: new Date().toISOString().split('T')[0],
        status: 'Not Started',
        contentTitle: CONTENT_TITLES[0],
        contentType: CONTENT_TYPES[0],
        format: FORMATS[0],
        topicTheme: '',
        funnelStatus: FUNNEL_STATUSES[0],
        visualIdeas: '',
        caption: '',
        customPrompt: '',
        creatives: [],
      };
      setFormData(initialData);
      setCaptionHistory(['']);
      setHistoryIndex(0);
    }
    setIsModalOpen(true);
  };

  const handleSavePost = async () => {
    if (!formData.contentTitle || !formData.date) return;

    const id = editingPost ? editingPost.id : Math.random().toString(36).substr(2, 9);
    const postData = {
      ...formData,
      id,
      userId: user?.uid || 'guest_user',
    } as Post;

    try {
      await setDoc(doc(db, 'posts', id), postData);
      setIsModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `posts/${id}`);
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'posts', id));
      if (editingPost?.id === id) {
        setIsModalOpen(false);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `posts/${id}`);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          creatives: [...(prev.creatives || []), reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeCreative = (index: number) => {
    setFormData(prev => ({
      ...prev,
      creatives: (prev.creatives || []).filter((_, i) => i !== index)
    }));
  };

  const updateCaption = (newCaption: string) => {
    setFormData(prev => ({ ...prev, caption: newCaption }));
    
    // Update history
    const newHistory = captionHistory.slice(0, historyIndex + 1);
    newHistory.push(newCaption);
    setCaptionHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setFormData(prev => ({ ...prev, caption: captionHistory[prevIndex] }));
    }
  };

  const handleRedo = () => {
    if (historyIndex < captionHistory.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setFormData(prev => ({ ...prev, caption: captionHistory[nextIndex] }));
    }
  };

  const handleGenerateCaption = async () => {
    if (!formData.contentTitle || !formData.topicTheme) {
      alert('Please fill in the Content Title and Topic/Theme first.');
      return;
    }

    setIsGenerating(true);
    try {
      const caption = await generateCaption({
        contentTitle: formData.contentTitle || '',
        contentType: formData.contentType || '',
        format: formData.format || '',
        topicTheme: formData.topicTheme || '',
        funnelStatus: formData.funnelStatus || '',
        customPrompt: formData.customPrompt || '',
      });
      updateCaption(caption);
    } catch (error) {
      alert('Failed to generate caption. Please check your API key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogin = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, usually not an error we need to scream about
        console.log("Login popup closed by user");
        return;
      }
      setError(err.message || "Login failed. Please try again.");
      console.error("Login failed", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const handleRestoreOldData = async () => {
    if (isSeeding) return;
    setIsSeeding(true);
    try {
      const targetUserId = user?.uid || 'guest_user';
      const batchPromises = INITIAL_POSTS.map(post => {
        const postData = { ...post, userId: targetUserId };
        return setDoc(doc(db, 'posts', post.id), postData);
      });
      await Promise.all(batchPromises);
      alert('Old data restored and saved to database!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'posts/batch');
    } finally {
      setIsSeeding(false);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1e293b] text-slate-300 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="px-3 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-lg tracking-tight">
            STLAF
          </div>
          <div>
            <h2 className="text-sm font-bold text-white leading-tight">Content Planner</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Marketing Department</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-4">
          <button 
            onClick={() => setViewMode('list')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${viewMode === 'list' ? 'bg-slate-700/50 text-amber-500 border-l-4 border-amber-500' : 'hover:bg-slate-800 hover:text-white text-slate-400'}`}
          >
            <LayoutList className="w-5 h-5" />
            Monthly Table
          </button>
          <button 
            onClick={() => setViewMode('kanban')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${viewMode === 'kanban' ? 'bg-slate-700/50 text-amber-500 border-l-4 border-amber-500' : 'hover:bg-slate-800 hover:text-white text-slate-400'}`}
          >
            <Columns className="w-5 h-5" />
            Kanban Board
          </button>
          <button 
            onClick={() => setViewMode('calendar')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${viewMode === 'calendar' ? 'bg-slate-700/50 text-amber-500 border-l-4 border-amber-500' : 'hover:bg-slate-800 hover:text-white text-slate-400'}`}
          >
            <CalendarIcon className="w-5 h-5" />
            Calendar View
          </button>
          
          <div className="pt-4 mt-4 border-t border-slate-700/50">
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl transition-all text-slate-400">
              <UserIcon className="w-5 h-5" />
              My Account
            </button>
          </div>
        </nav>

        <div className="p-6 border-t border-slate-700/50">
          {error && !user && (
            <div className="mb-4 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-rose-200 leading-tight">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="text-[9px] text-rose-400 hover:text-rose-300 font-bold uppercase mt-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
          {user ? (
            <div className="flex items-center gap-3">
              {user.photoURL && (
                <img src={user.photoURL} className="w-8 h-8 rounded-full border border-slate-600" alt="Profile" referrerPolicy="no-referrer" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{user.displayName}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1.5 text-slate-500 hover:text-rose-400 transition-all"
                title="Sign Out"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              Sign In
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-lg font-bold text-slate-800">
            {viewMode === 'list' ? 'Monthly Table' : viewMode === 'kanban' ? 'Kanban Board' : 'Calendar View'}
          </h1>
          <div className="flex items-center gap-6">
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Page Title & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Content Strategy Planner</h2>
                <p className="text-sm text-slate-500">Plan and manage your content across all channels.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleRestoreOldData}
                  disabled={isSeeding}
                  className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
                >
                  <Undo2 className="w-4 h-4" />
                  {isSeeding ? 'Restoring...' : 'Export CSV'}
                </button>
                <button 
                  onClick={() => handleOpenModal()}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Create New Task
                </button>
              </div>
            </div>

            {/* Month Navigation & Filters */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                  <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="px-4 font-bold text-slate-800 min-w-[160px] text-center">
                    {format(currentMonth, 'MMMM yyyy')}
                  </div>
                  <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <button 
                  onClick={handleToday}
                  className="text-sm font-bold text-slate-600 hover:text-amber-600 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm transition-all"
                >
                  Today
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search content..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
                      title="List View"
                    >
                      <LayoutList className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setViewMode('kanban')}
                      className={`p-1.5 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-slate-100 text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
                      title="Kanban View"
                    >
                      <Columns className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setViewMode('calendar')}
                      className={`p-1.5 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-slate-100 text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
                      title="Calendar View"
                    >
                      <CalendarIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <select 
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Ready for Review">Ready for Review</option>
                    <option value="Scheduled">Scheduled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* View Content */}
            <div className="min-h-[400px]">
              {viewMode === 'list' && (
                <MonthlyTableView 
                  currentMonth={currentMonth}
                  tableColumns={tableColumns}
                  posts={filteredPosts}
                  handleUpdatePostInline={handleUpdatePostInline}
                  handleCreateForDate={handleCreateForDate}
                  showColumnSettings={showColumnSettings}
                  setShowColumnSettings={setShowColumnSettings}
                  setTableColumns={setTableColumns}
                  toggleColumnVisibility={toggleColumnVisibility}
                  addCustomColumn={addCustomColumn}
                  sensors={sensors}
                  handleDragEnd={handleDragEnd}
                  isColumnsLocked={isColumnsLocked}
                  setIsColumnsLocked={setIsColumnsLocked}
                  handleCopy={handleCopy}
                  copiedId={copiedId}
                  setPreviewImage={setPreviewImage}
                  handleOpenModal={handleOpenModal}
                  handleDeletePost={handleDeletePost}
                  searchQuery={searchQuery}
                />
              )}
              {viewMode === 'kanban' && (
                <KanbanView 
                  filteredPosts={filteredPosts}
                  setFormData={setFormData}
                  handleOpenModal={handleOpenModal}
                />
              )}
              {viewMode === 'calendar' && (
                <CalendarView 
                  currentMonth={currentMonth}
                  posts={filteredPosts}
                  handleCreateForDate={handleCreateForDate}
                  handleOpenModal={handleOpenModal}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal / Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingPost ? 'Edit Post' : 'Create New Post'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 uppercase">Date</label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 uppercase">Status</label>
                    <select 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as PostStatus }))}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Ready for Review">Ready for Review</option>
                      <option value="Scheduled">Scheduled</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 uppercase">Creatives</label>
                  <div className="flex flex-wrap gap-3 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    {formData.creatives?.map((creative, idx) => (
                      <div key={idx} className="relative group h-20 w-20 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                        <img 
                          src={creative} 
                          alt={`Creative ${idx}`} 
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button 
                          onClick={() => removeCreative(idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="h-20 w-20 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-amber-600 hover:border-amber-400 hover:bg-amber-50 transition-all"
                    >
                      <Upload className="w-5 h-5" />
                      <span className="text-[10px] font-medium">Upload</span>
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden" 
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 uppercase">Content Title</label>
                    <select 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                      value={formData.contentTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, contentTitle: e.target.value }))}
                    >
                      {CONTENT_TITLES.map(title => (
                        <option key={title} value={title}>{title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 uppercase">Content Type</label>
                    <select 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                      value={formData.contentType}
                      onChange={(e) => setFormData(prev => ({ ...prev, contentType: e.target.value }))}
                    >
                      {CONTENT_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 uppercase">Format</label>
                    <select 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                      value={formData.format}
                      onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value }))}
                    >
                      {FORMATS.map(format => (
                        <option key={format} value={format}>{format}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 uppercase">Funnel Status</label>
                    <select 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                      value={formData.funnelStatus}
                      onChange={(e) => setFormData(prev => ({ ...prev, funnelStatus: e.target.value }))}
                    >
                      {FUNNEL_STATUSES.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 uppercase">Topic / Theme</label>
                  <input 
                    type="text" 
                    placeholder="What is this content about?"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                    value={formData.topicTheme}
                    onChange={(e) => setFormData(prev => ({ ...prev, topicTheme: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 uppercase">Custom AI Instructions (Optional)</label>
                  <textarea 
                    rows={2}
                    placeholder="e.g., Make it sound more casual, mention a specific event, or use a particular tone."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all resize-none text-sm"
                    value={formData.customPrompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, customPrompt: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 uppercase">Visual Ideas (URL)</label>
                  <input 
                    type="url" 
                    placeholder="Link to Canva, Figma, etc."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                    value={formData.visualIdeas}
                    onChange={(e) => setFormData(prev => ({ ...prev, visualIdeas: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <label className="text-xs font-medium text-slate-500 uppercase">Caption</label>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={handleUndo}
                            disabled={historyIndex <= 0}
                            className="p-1 text-slate-400 hover:text-amber-600 disabled:text-slate-200 transition-colors"
                            title="Undo"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={handleRedo}
                            disabled={historyIndex >= captionHistory.length - 1}
                            className="p-1 text-slate-400 hover:text-amber-600 disabled:text-slate-200 transition-colors"
                            title="Redo"
                          >
                            <Redo2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {formData.caption && (
                          <button 
                            onClick={() => handleCopy(formData.caption!, 'modal')}
                            className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-amber-600 transition-colors px-2 py-0.5 bg-slate-100 rounded"
                          >
                            {copiedId === 'modal' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            {copiedId === 'modal' ? 'Copied!' : 'Copy'}
                          </button>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={handleGenerateCaption}
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 disabled:text-slate-400 transition-colors"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      Generate with AI
                    </button>
                  </div>
                  <textarea 
                    rows={6}
                    placeholder="Write your caption here or use AI to generate one..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all resize-none text-sm"
                    value={formData.caption}
                    onChange={(e) => updateCaption(e.target.value)}
                  />
                  <div className="text-[10px] text-slate-400 text-right">
                    History: {historyIndex + 1} / {captionHistory.length}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                {editingPost && (
                  <button 
                    onClick={() => handleDeletePost(editingPost.id)}
                    className="px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors mr-auto"
                  >
                    Delete Post
                  </button>
                )}
                <button 
                  onClick={handleSavePost}
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 text-sm font-bold rounded-lg transition-colors shadow-sm"
                >
                  Save Post
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Preview Lightbox */}
      <AnimatePresence>
        {previewImage && (
          <div 
            className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-slate-900/90 backdrop-blur-md"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={previewImage} 
                alt="Preview" 
                className="max-w-full max-h-[85vh] rounded-lg shadow-2xl border border-white/10"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => setPreviewImage(null)}
                className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SortableHeaderProps {
  col: TableColumn;
  isLocked: boolean;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ col, isLocked }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: col.id, disabled: isLocked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <th 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`${col.width} px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${isLocked ? '' : 'cursor-grab active:cursor-grabbing hover:bg-slate-100'} transition-colors relative group`}
    >
      <div className="flex items-center gap-2">
        {!isLocked && <GripVertical className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
        {col.label}
      </div>
    </th>
  );
};

interface SortableColumnItemProps {
  col: TableColumn;
  toggleColumnVisibility: (id: ColumnId) => void;
  setTableColumns: Dispatch<SetStateAction<TableColumn[]>>;
  isLocked: boolean;
}

const SortableColumnItem: React.FC<SortableColumnItemProps> = ({ 
  col, 
  toggleColumnVisibility, 
  setTableColumns,
  isLocked
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: col.id, disabled: isLocked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 60 : undefined,
    position: 'relative' as const,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg group ${isDragging ? 'bg-white shadow-lg ring-1 ring-indigo-200 opacity-80' : ''}`}
    >
      <div className="flex items-center gap-3">
        {!isLocked && (
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-200 rounded text-slate-400">
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        )}
        <input 
          type="checkbox" 
          checked={col.visible}
          onChange={() => toggleColumnVisibility(col.id)}
          className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
        />
        <span className="text-xs font-medium text-slate-700">{col.label}</span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <select 
          value={col.width}
          onChange={(e) => setTableColumns(prev => prev.map(c => c.id === col.id ? { ...c, width: e.target.value } : c))}
          className="text-[10px] bg-slate-100 border-none rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="w-24">XS</option>
          <option value="w-32">S</option>
          <option value="w-40">M</option>
          <option value="w-48">L</option>
          <option value="w-64">XL</option>
          <option value="w-80">XXL</option>
        </select>
        <button 
          onClick={() => {
            const newName = prompt('Enter new column name:', col.label);
            if (newName) {
              setTableColumns(prev => prev.map(c => c.id === col.id ? { ...c, label: newName } : c));
            }
          }}
          className="p-1 hover:bg-indigo-100 text-indigo-500 rounded"
          title="Rename Column"
        >
          <Edit2 className="w-3 h-3" />
        </button>
        {col.id.toString().startsWith('custom_') && (
          <button 
            onClick={() => setTableColumns(prev => prev.filter(c => c.id !== col.id))}
            className="p-1 hover:bg-rose-100 text-rose-500 rounded"
            title="Delete Column"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}



