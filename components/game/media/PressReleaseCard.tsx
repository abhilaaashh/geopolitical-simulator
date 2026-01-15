'use client';

import { motion } from 'framer-motion';
import { FileText, Shield, AlertTriangle, Lock, Unlock } from 'lucide-react';
import type { GameEvent } from '@/lib/types';
import { formatTime } from '@/lib/utils';

interface PressReleaseCardProps {
  event: GameEvent;
  actorColor?: string;
}

// Government/Organization seals and styling
const ORG_STYLES: Record<string, {
  seal: string;
  name: string;
  department?: string;
  bg: string;
  accent: string;
}> = {
  'White House': {
    seal: '🦅',
    name: 'THE WHITE HOUSE',
    department: 'Office of the Press Secretary',
    bg: 'bg-gradient-to-b from-blue-950 to-slate-950',
    accent: 'text-blue-300',
  },
  'Kremlin': {
    seal: '🏛️',
    name: 'KREMLIN',
    department: 'Presidential Press Service',
    bg: 'bg-gradient-to-b from-red-950 to-slate-950',
    accent: 'text-red-300',
  },
  'NATO': {
    seal: '⭐',
    name: 'NATO',
    department: 'Office of the Secretary General',
    bg: 'bg-gradient-to-b from-blue-900 to-slate-950',
    accent: 'text-blue-400',
  },
  'United Nations': {
    seal: '🌐',
    name: 'UNITED NATIONS',
    department: 'Office of the Secretary-General',
    bg: 'bg-gradient-to-b from-sky-950 to-slate-950',
    accent: 'text-sky-300',
  },
  'European Union': {
    seal: '🇪🇺',
    name: 'EUROPEAN UNION',
    department: 'European External Action Service',
    bg: 'bg-gradient-to-b from-blue-950 to-indigo-950',
    accent: 'text-yellow-300',
  },
  'Pentagon': {
    seal: '⬟',
    name: 'U.S. DEPARTMENT OF DEFENSE',
    department: 'Office of the Pentagon Press Secretary',
    bg: 'bg-gradient-to-b from-slate-900 to-slate-950',
    accent: 'text-gray-300',
  },
  'State Department': {
    seal: '🦅',
    name: 'U.S. DEPARTMENT OF STATE',
    department: 'Office of the Spokesperson',
    bg: 'bg-gradient-to-b from-blue-900 to-slate-950',
    accent: 'text-blue-200',
  },
  'Ministry of Foreign Affairs': {
    seal: '🏛️',
    name: 'MINISTRY OF FOREIGN AFFAIRS',
    bg: 'bg-gradient-to-b from-gray-900 to-slate-950',
    accent: 'text-gray-300',
  },
  'default': {
    seal: '📜',
    name: 'OFFICIAL STATEMENT',
    bg: 'bg-gradient-to-b from-gray-900 to-slate-950',
    accent: 'text-gray-300',
  },
};

const CLASSIFICATION_STYLES = {
  public: {
    icon: Unlock,
    label: 'PUBLIC RELEASE',
    color: 'text-green-400',
    bg: 'bg-green-900/20',
    border: 'border-green-700/30',
  },
  confidential: {
    icon: Shield,
    label: 'CONFIDENTIAL',
    color: 'text-yellow-400',
    bg: 'bg-yellow-900/20',
    border: 'border-yellow-700/30',
  },
  leaked: {
    icon: AlertTriangle,
    label: 'LEAKED DOCUMENT',
    color: 'text-red-400',
    bg: 'bg-red-900/20',
    border: 'border-red-700/30',
  },
};

export function PressReleaseCard({ event, actorColor }: PressReleaseCardProps) {
  const organization = event.media?.organization || event.actorName;
  const orgStyle = ORG_STYLES[organization] || ORG_STYLES['default'];
  const classification = event.media?.classification || 'public';
  const classStyle = CLASSIFICATION_STYLES[classification];
  const ClassIcon = classStyle.icon;
  
  const isPlayer = event.isPlayerAction;
  const date = new Date(event.timestamp);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`${orgStyle.bg} rounded-lg border border-gray-700 overflow-hidden ${
        isPlayer ? 'ring-2 ring-game-accent/50' : ''
      }`}
    >
      {/* Classification banner */}
      <div className={`${classStyle.bg} ${classStyle.border} border-b px-4 py-2 flex items-center gap-2`}>
        <ClassIcon className={`w-4 h-4 ${classStyle.color}`} />
        <span className={`text-xs font-bold uppercase tracking-wider ${classStyle.color}`}>
          {classStyle.label}
        </span>
        {isPlayer && (
          <span className="ml-auto text-xs bg-game-accent/20 text-game-accent px-2 py-0.5 rounded-full">
            Your Statement
          </span>
        )}
      </div>

      {/* Official header */}
      <div className="px-6 pt-6 pb-4 text-center border-b border-gray-700/50">
        {/* Seal/Logo */}
        <div className="text-5xl mb-3">{orgStyle.seal}</div>
        
        {/* Organization name */}
        <h2 className={`text-lg font-bold tracking-[0.2em] ${orgStyle.accent}`}>
          {orgStyle.name}
        </h2>
        
        {/* Department */}
        {orgStyle.department && (
          <p className="text-sm text-gray-400 mt-1 tracking-wide">
            {orgStyle.department}
          </p>
        )}

        {/* Decorative line */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="h-px w-16 bg-gray-600" />
          <FileText className="w-4 h-4 text-gray-500" />
          <div className="h-px w-16 bg-gray-600" />
        </div>
      </div>

      {/* Document content */}
      <div className="px-6 py-6">
        {/* Release info */}
        <div className="mb-6 text-sm text-gray-400 uppercase tracking-wide">
          <p>FOR IMMEDIATE RELEASE</p>
          <p>{formattedDate}</p>
        </div>

        {/* Statement title */}
        <h3 className="text-xl font-semibold text-white mb-4 leading-tight">
          Statement by {event.actorName} on {typeof event.impact?.description === 'string' ? event.impact.description.split(' ').slice(0, 5).join(' ') : 'Recent Developments'}
        </h3>

        {/* Horizontal rule */}
        <div className="h-px bg-gray-700 mb-4" />

        {/* Statement content */}
        <div className="text-gray-200 leading-relaxed whitespace-pre-wrap space-y-4">
          {event.content.split('\n\n').map((paragraph, i) => (
            <p key={i} className={i === 0 ? '' : 'mt-4'}>
              {i === 0 && <span className="text-2xl font-serif text-gray-400 mr-1">"</span>}
              {paragraph}
              {i === event.content.split('\n\n').length - 1 && (
                <span className="text-2xl font-serif text-gray-400 ml-1">"</span>
              )}
            </p>
          ))}
        </div>

        {/* Signature line */}
        <div className="mt-6 pt-4 border-t border-gray-700/50">
          <p className="text-gray-400 text-sm">— END OF STATEMENT —</p>
        </div>
      </div>

      {/* Impact section */}
      {event.impact && typeof event.impact.description === 'string' && (
        <div className="px-6 pb-6">
          <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
            <p className="text-sm text-gray-400">
              <span className="font-semibold text-gray-300">Diplomatic Impact:</span>{' '}
              {event.impact.description}
            </p>
            {event.impact.affectedActors && Array.isArray(event.impact.affectedActors) && event.impact.affectedActors.length > 0 && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500">Affects:</span>
                {event.impact.affectedActors.map((actorId, idx) => (
                  <span
                    key={typeof actorId === 'string' ? actorId : idx}
                    className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-300"
                  >
                    {typeof actorId === 'string' ? actorId : String(actorId)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer with timestamp */}
      <div className="px-6 py-3 bg-gray-900/30 border-t border-gray-700/50 flex items-center justify-between text-xs text-gray-500">
        <span>Document ID: {event.id.slice(0, 8).toUpperCase()}</span>
        <span>{formatTime(event.timestamp)}</span>
      </div>
    </motion.div>
  );
}
