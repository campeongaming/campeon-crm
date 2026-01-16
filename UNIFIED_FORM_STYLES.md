# Unified Form Styling Guidelines

## CSS Classes to Use Across All Forms

### Section Containers
```
p-6 bg-slate-700/20 rounded-xl border border-cyan-400/20 backdrop-blur-sm shadow-lg hover:border-cyan-400/40 transition-all
```

### Section Headers
```
text-xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent mb-5
```

### Input Fields
```
w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:outline-none transition-all text-base
```

### Select Dropdowns
```
w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:outline-none transition-all text-base cursor-pointer
```

### Labels
```
block text-base font-semibold text-slate-200 mb-2
```

### Checkboxes
```
w-5 h-5 cursor-pointer accent-cyan-500
```

### Submit Button
```
w-full py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:from-cyan-400 hover:via-blue-400 hover:to-indigo-400 text-white font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]
```

### Error Container
```
bg-red-500/10 border border-red-400/40 rounded-xl p-5 backdrop-blur-sm shadow-md
```

### Loading Indicator
```
bg-cyan-500/10 border border-cyan-400/40 rounded-xl p-5 backdrop-blur-sm shadow-md
```

### Form Header
```
bg-gradient-to-br from-cyan-500/90 via-blue-500/90 to-indigo-500/90 p-8 rounded-2xl shadow-xl backdrop-blur-sm border border-white/10
```

## Color Palette
- Primary: Cyan/Blue/Indigo gradient
- Backgrounds: Slate with transparency
- Borders: Cyan with 20-40% opacity
- Text: Slate-100 to Slate-200
- Focus states: Cyan with glow effect
