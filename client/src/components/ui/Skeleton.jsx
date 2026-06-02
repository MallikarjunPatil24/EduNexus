import React from 'react';

const Skeleton = ({ className, count = 1 }) => {
  const items = Array.from({ length: count });

  if (count === 1) {
    return (
      <div className={`animate-pulse bg-navy-light/10 dark:bg-gold/10 rounded ${className}`} />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((_, idx) => (
        <div 
          key={idx} 
          className={`animate-pulse bg-navy-light/10 dark:bg-gold/10 rounded ${className}`} 
        />
      ))}
    </div>
  );
};

export default Skeleton;
