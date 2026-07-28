import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Frame } from '../components/Frame.js';
import { KeyHints } from '../components/KeyHints.js';
import { StatusMessage } from '../components/StatusMessage.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import type { ThemeService } from '../services/config/theme-service.js';
import { useTheme } from '../themes/ThemeContext.js';
import { getThemeGlyphs } from '../themes/themes.js';
import type { ResolvedTheme, ThemeDefinition } from '../types/theme.js';
import { getResponsiveLayout } from '../utils/responsive-layout.js';

type ApplyChoice = 'restart' | 'next-launch' | 'cancel';

interface ThemePickerScreenProps {
  service: ThemeService;
  originalTheme: ResolvedTheme;
  onPreview: (theme: ResolvedTheme) => void;
  onApply: (theme: ResolvedTheme, restart: boolean) => void;
  onCancel: () => void;
  onHelp: () => void;
}

const choices: Array<{ value: ApplyChoice; label: string; description: string }> = [
  {
    value: 'restart',
    label: 'Apply & restart',
    description: 'Save this theme and redraw sshx now'
  },
  {
    value: 'next-launch',
    label: 'Apply next launch',
    description: 'Save it, but keep the current appearance until next time'
  },
  { value: 'cancel', label: 'Cancel', description: 'Keep the previous theme' }
];

export const ThemePickerScreen = ({
  service,
  originalTheme,
  onPreview,
  onApply,
  onCancel,
  onHelp
}: ThemePickerScreenProps): React.ReactElement => {
  const theme = useTheme();
  const glyphs = getThemeGlyphs(theme.ascii);
  const { columns, rows } = useTerminalSize();
  const layout = getResponsiveLayout(columns, rows);
  const compact = layout === 'narrow';
  const [themes, setThemes] = useState<ThemeDefinition[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [choiceIndex, setChoiceIndex] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const selected = themes[selectedIndex];
  const visibleThemes = useMemo(() => {
    const count = Math.max(rows - (compact ? 9 : 13), 4);
    const start = Math.max(
      Math.min(selectedIndex - Math.floor(count / 2), themes.length - count),
      0
    );
    return themes.slice(start, start + count);
  }, [compact, rows, selectedIndex, themes]);

  useEffect(() => {
    void service
      .list()
      .then((items) => {
        setThemes(items);
        setSelectedIndex(
          Math.max(
            items.findIndex(({ name }) => name === originalTheme.name),
            0
          )
        );
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : 'Failed to load themes');
      })
      .finally(() => setLoading(false));
  }, [originalTheme.name, service]);

  useEffect(() => {
    if (!selected || confirming) return;
    let active = true;

    void service
      .preview(selected.name)
      .then((preview) => {
        if (active) onPreview(preview);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : 'Preview failed');
      });

    return (): void => {
      active = false;
    };
  }, [confirming, onPreview, selected, service]);

  const cancel = (): void => {
    onPreview(originalTheme);
    onCancel();
  };

  const applyChoice = (): void => {
    const choice = choices[choiceIndex]?.value;
    if (!selected || !choice || saving) return;
    if (choice === 'cancel') {
      cancel();
      return;
    }

    setSaving(true);
    setError('');
    void service
      .update({ name: selected.name })
      .then((persisted) => {
        if (choice === 'next-launch') onPreview(originalTheme);
        onApply(persisted, choice === 'restart');
      })
      .catch((caught: unknown) => {
        setSaving(false);
        setError(caught instanceof Error ? caught.message : 'Failed to save theme');
      });
  };

  useInput((input, key) => {
    if (saving) return;
    if (key.escape) {
      if (confirming) {
        setConfirming(false);
        setChoiceIndex(0);
      } else cancel();
      return;
    }
    if (input === '?') {
      onHelp();
      return;
    }

    const itemCount = confirming ? choices.length : themes.length;
    const setIndex = confirming ? setChoiceIndex : setSelectedIndex;
    if (key.downArrow || input === 'j') {
      setIndex((current) => Math.min(current + 1, Math.max(itemCount - 1, 0)));
    } else if (key.upArrow || input === 'k') {
      setIndex((current) => Math.max(current - 1, 0));
    } else if (key.return) {
      if (confirming) applyChoice();
      else if (selected) setConfirming(true);
    }
  });

  return (
    <Frame
      title={
        <Text color={theme.accent} bold>
          Theme picker
        </Text>
      }
      subtitle={!compact ? <Text color={theme.muted}>live preview</Text> : undefined}
      footer={
        <Box flexDirection="column">
          <KeyHints
            compact={compact}
            hints={
              confirming
                ? [
                    { key: `${glyphs.up}${glyphs.down}`, label: 'choose action' },
                    { key: glyphs.enter, label: 'confirm' },
                    { key: 'Esc', label: 'back' }
                  ]
                : [
                    { key: `${glyphs.up}${glyphs.down}`, label: 'preview theme' },
                    { key: glyphs.enter, label: 'select' },
                    { key: '?', label: 'help' },
                    { key: 'Esc', label: 'restore' }
                  ]
            }
          />
          <StatusMessage
            message={error || (saving ? 'Saving theme' : '')}
            tone={error ? 'danger' : 'info'}
            busy={saving}
          />
        </Box>
      }
      compact={compact}
      height={rows}
    >
      {confirming && selected ? (
        <Box flexDirection="column">
          <Text color={theme.text}>
            Apply{' '}
            <Text color={theme.selected} bold>
              {selected.label}
            </Text>
            ?
          </Text>
          {choices.map((choice, index) => (
            <Box key={choice.value} flexDirection="column" marginTop={compact ? 0 : 1}>
              <Text
                color={index === choiceIndex ? theme.selected : theme.text}
                bold={index === choiceIndex}
              >
                {index === choiceIndex ? `${glyphs.cursor} ` : '  '}
                {choice.label}
              </Text>
              {!compact ? <Text color={theme.muted}> {choice.description}</Text> : null}
            </Box>
          ))}
        </Box>
      ) : loading ? (
        <StatusMessage message="Loading installed themes" busy />
      ) : (
        <Box flexDirection={layout === 'wide' ? 'row' : 'column'}>
          <Box flexDirection="column" width={layout === 'wide' ? 36 : '100%'}>
            {visibleThemes.map((item) => {
              const active = item.name === selected?.name;
              return (
                <Text key={item.name} color={active ? theme.selected : theme.text} bold={active}>
                  {active ? `${glyphs.cursor} ` : '  '}
                  {item.label}
                  <Text color={theme.muted}> [{item.source}]</Text>
                </Text>
              );
            })}
          </Box>
          {selected ? (
            <Box
              flexDirection="column"
              flexGrow={1}
              marginLeft={layout === 'wide' ? 3 : 0}
              marginTop={layout === 'wide' ? 0 : 1}
            >
              <Text color={theme.selected} bold>
                {selected.label}
              </Text>
              <Text color={theme.text}>{selected.description}</Text>
              {!compact ? (
                <>
                  <Text color={theme.muted}>Name: {selected.name}</Text>
                  <Text color={theme.muted}>
                    Palette: <Text color={theme.accent}>accent</Text>{' '}
                    <Text color={theme.success}>success</Text>{' '}
                    <Text color={theme.warning}>warning</Text>{' '}
                    <Text color={theme.danger}>danger</Text>
                  </Text>
                </>
              ) : null}
            </Box>
          ) : null}
        </Box>
      )}
    </Frame>
  );
};
