import React from "react";

export const Button = ({ children, className, ...props }: any) => (
  <button className={`px-4 py-2 rounded bg-[#00a8ff] text-white hover:bg-[#00a8ff]/80 transition-colors ${className}`} {...props}>
    {children}
  </button>
);

export const Card = ({ children, className }: any) => (
  <div className={`bg-[#0a1428]/60 border border-[#00a8ff]/20 rounded-lg ${className}`}>
    {children}
  </div>
);

export const CardContent = ({ children, className }: any) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

export const Input = (props: any) => (
  <input className="w-full bg-[#050a14] border border-[#00a8ff]/20 rounded px-3 py-2 text-white focus:border-[#00a8ff]/50 outline-none" {...props} />
);

export const ScrollArea = ({ children, className }: any) => (
  <div className={`overflow-auto ${className}`}>
    {children}
  </div>
);

export const Select = ({ children, onValueChange, value }: any) => {
    return (
        <select 
            value={value} 
            onChange={(e) => onValueChange(e.target.value)}
            className="bg-[#0a1428] border border-[#00a8ff]/20 rounded px-2 py-1 text-xs text-white outline-none"
        >
            {children}
        </select>
    );
};

export const SelectTrigger = ({ children, className }: any) => <div className={className}>{children}</div>;
export const SelectValue = ({ placeholder }: any) => <span>{placeholder}</span>;
export const SelectContent = ({ children }: any) => <>{children}</>;
export const SelectItem = ({ value, children }: any) => <option value={value}>{children}</option>;
