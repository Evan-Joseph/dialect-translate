import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from "@/lib/utils";

interface EmptyProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  className?: string;
}

export function Empty({ 
  icon: Icon, 
  title = '暂无数据', 
  description = '这里还没有任何内容', 
  className 
}: EmptyProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-8 text-center", className)}>
      {Icon && (
        <div className="mb-4">
          <Icon className="w-12 h-12 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm max-w-sm">{description}</p>
    </div>
  );
}

export default Empty;