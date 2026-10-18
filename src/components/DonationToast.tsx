/**
 * @license
 * Sunshine Brigade Worksheet Builder - Post-Download Donation Prompt
 * Shows an unobtrusive, dismissible toast card after a successful PDF export or print.
 * Configurable via /src/config/appConfig.ts. Never blocks or delays downloading.
 */

import React from 'react';
import { DONATION_CONFIG } from '../config/appConfig';
import { Heart, X, ExternalLink } from 'lucide-react';

interface DonationToastProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export const DonationToast: React.FC<DonationToastProps> = ({ isVisible, onDismiss }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white border border-[#E2DEC9] rounded-2xl shadow-2xl p-4.5 animate-in slide-in-from-bottom-3 duration-200">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-red-50 text-[#E52311] flex items-center justify-center shrink-0">
          <Heart className="w-5 h-5 fill-current" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-[#2D2200]">
              {DONATION_CONFIG.title}
            </h4>
            <button
              onClick={onDismiss}
              className="text-[#A39C8E] hover:text-[#2D2200] p-1 rounded-lg transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[#6B5838] mt-1 leading-relaxed">
            {DONATION_CONFIG.message}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <a
              href={DONATION_CONFIG.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#E52311] hover:bg-red-700 rounded-lg shadow-xs transition-colors"
            >
              <span>{DONATION_CONFIG.buttonText}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={onDismiss}
              className="px-2.5 py-1.5 text-xs font-semibold text-[#6B5838] hover:text-[#2D2200] transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
