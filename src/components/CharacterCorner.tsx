/**
 * @license
 * Sunshine Brigade Worksheet Builder
 * CharacterCorner: Renders the chosen Sunshine Brigade character in the corner of a block.
 * Per specification:
 * - Load character images from /characters folder by id (buddy.svg, finn.svg, etc.)
 * - Show a simple labelled placeholder circle if a file is missing
 */

import React, { useState } from 'react';
import { BlockCharacterConfig } from '../types';
import { CHARACTERS, assetUrl } from '../config/appConfig';

interface CharacterCornerProps {
  config?: BlockCharacterConfig | null;
  blockWidth: number;
  blockHeight: number;
}

export const CharacterCorner: React.FC<CharacterCornerProps> = ({
  config,
  blockWidth,
  blockHeight,
}) => {
  const [imageError, setImageError] = useState(false);

  if (!config || !config.id) return null;

  const characterInfo = CHARACTERS.find((c) => c.id === config.id) || {
    id: config.id,
    name: config.id,
    species: 'Friend',
    color: '#009BD9',
  };

  const badgeSize = Math.min(52, Math.max(38, Math.min(blockWidth, blockHeight) * 0.18));
  const padding = 10;

  let x = padding;
  let y = padding;

  if (config.corner === 'top-right') {
    x = blockWidth - badgeSize - padding;
    y = padding;
  } else if (config.corner === 'bottom-left') {
    x = padding;
    y = blockHeight - badgeSize - padding;
  } else if (config.corner === 'bottom-right') {
    x = blockWidth - badgeSize - padding;
    y = blockHeight - badgeSize - padding;
  }

  const imageHref = assetUrl(`characters/${config.id}.svg`);

  return (
    <g className="character-corner-badge" pointerEvents="none">
      {!imageError ? (
        <g>
          {/* Subtle white circle backing to stand out from lines */}
          <circle
            cx={x + badgeSize / 2}
            cy={y + badgeSize / 2}
            r={badgeSize / 2 + 2}
            fill="#FFFFFF"
            stroke="#2D2200"
            strokeWidth="1.5"
          />
          <image
            href={imageHref}
            x={x}
            y={y}
            width={badgeSize}
            height={badgeSize}
            preserveAspectRatio="xMidYMid meet"
            onError={() => setImageError(true)}
          />
        </g>
      ) : (
        /* Fallback placeholder circle if image fails to load */
        <g>
          <circle
            cx={x + badgeSize / 2}
            cy={y + badgeSize / 2}
            r={badgeSize / 2}
            fill="#FFF"
            stroke="#2D2200"
            strokeWidth="2"
          />
          <circle
            cx={x + badgeSize / 2}
            cy={y + badgeSize / 2}
            r={badgeSize / 2 - 3}
            fill={characterInfo.color}
            opacity="0.8"
          />
          <text
            x={x + badgeSize / 2}
            y={y + badgeSize / 2 + 4}
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="12"
            fontWeight="bold"
            fontFamily="Nunito, sans-serif"
          >
            {characterInfo.name.charAt(0)}
          </text>
        </g>
      )}
    </g>
  );
};
