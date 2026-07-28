import React, { useState } from 'react';
import { useApp } from 'ink';
import type { ConnectionService } from '../services/config/connection-service.js';
import type { SnippetService } from '../services/config/snippet-service.js';
import type { ThemeService } from '../services/config/theme-service.js';
import type { ConnectionHealthService } from '../services/ssh/connection-health-service.js';
import type { ExternalPaletteCommand } from '../services/palette/command-palette.js';
import type { SshConnection } from '../types/connection.js';
import type { KeymapConfig } from '../types/keymap.js';
import type { ResolvedTheme } from '../types/theme.js';
import { MainScreen } from '../screens/MainScreen.js';
import { SnippetManagerScreen } from '../screens/SnippetManagerScreen.js';
import { AboutScreen } from '../screens/AboutScreen.js';
import { HelpScreen, type HelpContext } from '../screens/HelpScreen.js';
import { ThemePickerScreen } from '../screens/ThemePickerScreen.js';
import { ThemeProvider } from '../themes/ThemeContext.js';

interface AppProps {
  connectionService: ConnectionService;
  snippetService: SnippetService;
  themeService: ThemeService;
  healthService: ConnectionHealthService;
  keymap: KeymapConfig;
  onPaletteCommand: (command: ExternalPaletteCommand, args: string[]) => Promise<string>;
  onConnect: (connection: SshConnection) => void;
  onRestart: () => void;
  theme: ResolvedTheme;
}

export const App = ({
  connectionService,
  snippetService,
  themeService,
  healthService,
  keymap,
  onPaletteCommand,
  onConnect,
  onRestart,
  theme
}: AppProps): React.ReactElement => {
  const app = useApp();
  const [snippetQuery, setSnippetQuery] = useState<string>();
  const [activeTheme, setActiveTheme] = useState(theme);
  const [originalTheme, setOriginalTheme] = useState(theme);
  const [screen, setScreen] = useState<'main' | 'snippets' | 'themes' | 'help' | 'about'>('main');
  const [helpContext, setHelpContext] = useState<HelpContext>('connections');
  const [returnScreen, setReturnScreen] = useState<'main' | 'snippets' | 'themes' | 'help'>('main');
  const [aboutReturnScreen, setAboutReturnScreen] = useState<'main' | 'help'>('main');

  const openHelp = (context: HelpContext, from: 'main' | 'snippets' | 'themes' = 'main'): void => {
    setHelpContext(context);
    setReturnScreen(from);
    setScreen('help');
  };

  const openThemes = (): void => {
    setOriginalTheme(activeTheme);
    setScreen('themes');
  };

  return (
    <ThemeProvider theme={activeTheme}>
      {screen === 'snippets' ? (
        <SnippetManagerScreen
          service={snippetService}
          initialQuery={snippetQuery ?? ''}
          onClose={() => {
            setSnippetQuery(undefined);
            setScreen('main');
          }}
          onHelp={() => openHelp('snippets', 'snippets')}
        />
      ) : screen === 'themes' ? (
        <ThemePickerScreen
          service={themeService}
          originalTheme={originalTheme}
          onPreview={setActiveTheme}
          onCancel={() => setScreen('main')}
          onHelp={() => openHelp('themes', 'themes')}
          onApply={(persistedTheme, restart) => {
            if (restart) {
              setActiveTheme(persistedTheme);
              onRestart();
              app.exit();
            } else {
              setScreen('main');
            }
          }}
        />
      ) : screen === 'help' ? (
        <HelpScreen
          context={helpContext}
          onClose={() => setScreen(returnScreen)}
          onAbout={() => {
            setAboutReturnScreen('help');
            setScreen('about');
          }}
        />
      ) : screen === 'about' ? (
        <AboutScreen onClose={() => setScreen(aboutReturnScreen)} />
      ) : (
        <MainScreen
          connectionService={connectionService}
          healthService={healthService}
          onPaletteCommand={onPaletteCommand}
          onOpenSnippets={(query) => {
            setSnippetQuery(query);
            setScreen('snippets');
          }}
          onOpenThemes={openThemes}
          onOpenHelp={() => openHelp('connections')}
          onOpenAbout={() => {
            setAboutReturnScreen('main');
            setScreen('about');
          }}
          snippetManagerKey={keymap.snippetManager}
          onConnect={onConnect}
        />
      )}
    </ThemeProvider>
  );
};
