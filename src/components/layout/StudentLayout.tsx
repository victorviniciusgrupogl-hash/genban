import { useExpertTheme } from '@/contexts/ExpertThemeContext';
import { TecnologicoLayout } from './student/TecnologicoLayout';
import { ProfissionalLayout } from './student/ProfissionalLayout';
import { ClassicoLayout }     from './student/ClassicoLayout';
import { ModernoLayout }      from './student/ModernoLayout';

export function StudentLayout() {
  const { theme } = useExpertTheme();

  switch (theme.layoutPreset) {
    case 'profissional': return <ProfissionalLayout />;
    case 'classico':     return <ClassicoLayout />;
    case 'moderno':      return <ModernoLayout />;
    default:             return <TecnologicoLayout />;
  }
}
