'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';
import { useTranslation } from '@/hooks/useTranslation';

interface TeamMember {
  id: string;
  name: string;
  position: string;
  image: string;
  description: string;
  ttl: string;
  alamat: string;
  motto: string;
}

interface TeamMemberModalProps {
  member: TeamMember;
  isOpen: boolean;
  onClose: () => void;
}

const TeamMemberModal: React.FC<TeamMemberModalProps> = ({ member, isOpen, onClose }) => {
  const { t } = useTranslation();
  const scrollPositionRef = useRef<number>(0);
  
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position before locking
      scrollPositionRef.current = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      
      // Lock body scroll with fixed position to prevent scroll jump
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scroll position when closing
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      
      // Restore scroll position
      if (scrollPositionRef.current > 0) {
        window.scrollTo(0, scrollPositionRef.current);
      }
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Use portal to render at document body level, avoiding z-index stacking context issues
  if (typeof document === 'undefined') return null;
  
  const modalContent = (
    <div className="fixed inset-0 z-[100000] overflow-y-auto cursor-default">
      <div className="flex items-center justify-center min-h-screen pt-2 sm:pt-4 px-2 sm:px-4 pb-12 sm:pb-20 text-center sm:p-0 cursor-default">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-sm transition-opacity z-0"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="relative z-10 inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all my-2 sm:my-8 sm:align-middle w-full max-w-[95vw] sm:max-w-lg border border-gray-200 dark:border-gray-700 cursor-auto">
          <div className="bg-white dark:bg-gray-800 px-3 pt-3 pb-3 sm:px-6 sm:pt-5 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl leading-6 font-bold text-gray-900 dark:text-white">
                {member.name}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="mt-2">
              <div className="text-center mb-6">
                <div className="relative w-48 h-auto mx-auto rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-auto object-contain max-h-64"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/placeholder.svg';
                    }}
                  />
                </div>
              </div>
              
              <div className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold mb-4">
                {member.position}
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="font-semibold w-28 flex-shrink-0 text-gray-700 dark:text-gray-300">{t('memberModal.name') || 'Nama'}</span>
                  <span className="mx-2 text-gray-400">:</span>
                  <span className="text-gray-900 dark:text-white">{member.name}</span>
                </div>
                <div className="flex p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="font-semibold w-28 flex-shrink-0 text-gray-700 dark:text-gray-300">{t('memberModal.birthplace') || 'TTL'}</span>
                  <span className="mx-2 text-gray-400">:</span>
                  <span className="text-gray-900 dark:text-white">{member.ttl || '-'}</span>
                </div>
                <div className="flex p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="font-semibold w-28 flex-shrink-0 text-gray-700 dark:text-gray-300">{t('memberModal.address') || 'Alamat'}</span>
                  <span className="mx-2 text-gray-400">:</span>
                  <span className="text-gray-900 dark:text-white">{member.alamat || '-'}</span>
                </div>
                <div className="flex p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="font-semibold w-28 flex-shrink-0 text-gray-700 dark:text-gray-300">{t('memberModal.motto') || 'Motto'}</span>
                  <span className="mx-2 text-gray-400">:</span>
                  <span className="text-gray-900 dark:text-white italic">{member.motto || '-'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/30 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-base font-bold text-gray-900 hover:from-yellow-400 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:ml-3 sm:w-auto sm:text-sm transition-all cursor-pointer"
              onClick={onClose}
            >
              {t('common.close') || 'Tutup'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  return createPortal(modalContent, document.body);
};

export default TeamMemberModal;