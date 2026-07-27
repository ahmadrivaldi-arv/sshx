export const snippetPickerBindings = ['f2', 'ctrl-b-s', 'ctrl-g-s', 'ctrl-]-s'] as const;

export type SnippetPickerBinding = (typeof snippetPickerBindings)[number];

export interface KeymapConfig {
  snippetPicker: SnippetPickerBinding[];
  snippetManager: string;
}
