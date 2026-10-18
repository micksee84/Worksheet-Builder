/**
 * @license
 * Sunshine Brigade Worksheet Builder - Template Gallery Modal
 * Pre-made worksheets ready to load, customize, and print.
 */

import React from 'react';
import { getAllTemplates, TemplateItem } from '../templates';
import { Worksheet } from '../types';
import { X, Sparkles, BookOpen, ArrowRight } from 'lucide-react';

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: TemplateItem) => void;
}

export const TemplateGalleryModal: React.FC<TemplateGalleryModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  const templates = getAllTemplates();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-[#E2DEC9] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#E2DEC9] bg-[#FAF8F0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#009BD9]/15 flex items-center justify-center text-[#009BD9]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#2D2200]">
                Pre-Made Worksheet Templates
              </h2>
              <p className="text-xs text-[#6B5838]">
                Open any starter template to edit, customize, or print immediately.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#6B5838] hover:text-[#2D2200] hover:bg-[#F2F2E2] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-[#FAF8F0] border border-[#E2DEC9] hover:border-[#009BD9] rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-all group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#009BD9]">
                    {tpl.category}
                  </span>
                  <span className="text-[10px] font-mono text-[#6B5838] bg-white px-2 py-0.5 rounded border border-[#E2DEC9]">
                    {tpl.worksheet.pages.length} page
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-[#2D2200] group-hover:text-[#009BD9] transition-colors leading-snug">
                  {tpl.title}
                </h3>

                <p className="text-xs text-[#6B5838] leading-relaxed">
                  {tpl.description}
                </p>

                <div className="flex flex-wrap gap-1 pt-1">
                  {tpl.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-semibold text-[#6B5838] bg-white px-2 py-0.5 rounded border border-[#E2DEC9]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectTemplate(tpl)}
                className="mt-5 w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-[#2D2200] bg-[#F2B800] hover:bg-[#e0ab00] rounded-lg shadow-xs transition-colors"
              >
                <span>Load Template</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="px-6 py-3.5 border-t border-[#E2DEC9] bg-[#FAF8F0] text-center text-xs text-[#6B5838]">
          Loading a template will replace the current worksheet in the editor.
        </div>
      </div>
    </div>
  );
};
