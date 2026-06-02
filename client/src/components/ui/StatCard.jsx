import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, description, trend, color = 'navy' }) => {
  const colorMap = {
    navy: 'bg-navy border-navy-light text-cream',
    gold: 'bg-cream-dark border-gold/30 text-navy',
    green: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700',
    red: 'bg-red-500/10 border-red-500/20 text-red-700',
  };

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={`p-6 rounded-xl border shadow-sm flex flex-col justify-between ${colorMap[color] || colorMap.navy}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80 uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-bold font-serif mt-1">{value}</h3>
        </div>
        {Icon && (
          <div className="p-3 bg-navy-light/10 dark:bg-gold/10 rounded-lg text-gold">
            <Icon size={24} />
          </div>
        )}
      </div>
      
      {description && (
        <div className="mt-4 flex items-center justify-between text-xs opacity-75 border-t border-navy-light/10 pt-3">
          <span>{description}</span>
          {trend && (
            <span className={`font-semibold ${trend.type === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend.type === 'up' ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
