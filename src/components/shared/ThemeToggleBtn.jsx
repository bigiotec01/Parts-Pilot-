import {
  Sun, Moon
} from 'lucide-react';
import { useTheme } from '../../theme/ThemeContext';

export function ThemeToggleBtn({ small = false }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const size = small ? 'w-7 h-7' : 'w-[30px] h-[30px]';
  return (
    <button
      onClick={toggleTheme}
      className={`${size} rounded-[8px] flex items-center justify-center flex-shrink-0 transition-colors`}
      style={{ background: 'var(--pp-surface)', color: 'var(--pp-text2)' }}
      title={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
    >
      {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
    </button>
  );
}
