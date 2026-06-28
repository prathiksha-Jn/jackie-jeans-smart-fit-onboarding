/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  label?: string;
}

export default function ProgressBar({ currentStep, totalSteps, label }: ProgressBarProps) {
  // calculate percentage
  const percentage = Math.min(100, Math.max(0, (currentStep / totalSteps) * 100));

  return (
    <div className="w-full" id="quiz-progress-bar-container">
      <div className="flex items-center justify-between text-[10px] text-gray-500 font-sans mb-2 px-1">
        <span className="font-bold tracking-widest text-denim-700 bg-denim-100/50 px-2.5 py-1 rounded-md uppercase">
          {label || `Question ${currentStep} of ${totalSteps}`}
        </span>
        <span className="font-mono text-gray-400">{Math.round(percentage)}% Complete</span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-warm-muted">
        <motion.div
          className="h-full rounded-full bg-denim-700"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          id="quiz-progress-bar-indicator"
        />
      </div>
    </div>
  );
}
