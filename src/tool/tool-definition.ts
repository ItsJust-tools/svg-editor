import type { Tool } from '@itsjust/core';
import toolConfig from './tool.config';
import type { NotepadState } from './types';

function isNotepadState(value: unknown): value is NotepadState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as { text?: unknown; title?: unknown };
  return typeof v.text === 'string' && (v.title === undefined || typeof v.title === 'string');
}

export const notepadTool: Tool<NotepadState> = {
  id: toolConfig.id,
  name: toolConfig.name,
  version: toolConfig.version,
  config: toolConfig,
  initialState: {
    text: '',
  },
  serialize: (state) => JSON.stringify(state, null, 2),
  deserialize: (data) => {
    if (isNotepadState(data)) {
      return { success: true, data: { text: data.text, title: data.title } };
    }
    return {
      success: false,
      error: 'Invalid data format: expected { text: string, title?: string }',
    };
  },
  exporters: [
    { format: 'png', loader: () => import('./exporters/png') },
    { format: 'jpeg', loader: () => import('./exporters/jpeg') },
    { format: 'webp', loader: () => import('./exporters/webp') },
    { format: 'pdf', loader: () => import('./exporters/pdf') },
  ],
};
