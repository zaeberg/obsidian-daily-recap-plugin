import { describe, it, expect, vi } from 'vitest';
import { ObsidianSettingsAdapter } from '../../../../src/infrastructure/adapters/ObsidianSettingsAdapter';

describe('ObsidianSettingsAdapter', () => {
  describe('getDailyNotesFolder', () => {
    it('should return folder path when Daily Notes plugin is configured', () => {
      const mockApp = {
        // @ts-ignore
        internalPlugins: {
          plugins: {
            'daily-notes': {
              enabled: true,
              instance: {
                options: {
                  folder: 'Daily Notes',
                },
              },
            },
          },
        },
      };

      const adapter = new ObsidianSettingsAdapter(mockApp);
      const result = adapter.getDailyNotesFolder();

      expect(result).toBe('Daily Notes');
    });

    it('should return null when Daily Notes plugin is disabled', () => {
      const mockApp = {
        // @ts-ignore
        internalPlugins: {
          plugins: {
            'daily-notes': {
              enabled: false,
              instance: {
                options: {
                  folder: 'Daily Notes',
                },
              },
            },
          },
        },
      };

      const adapter = new ObsidianSettingsAdapter(mockApp);
      const result = adapter.getDailyNotesFolder();

      expect(result).toBeNull();
    });

    it('should return null when Daily Notes plugin does not exist', () => {
      const mockApp = {
        // @ts-ignore
        internalPlugins: {
          plugins: {},
        },
      };

      const adapter = new ObsidianSettingsAdapter(mockApp);
      const result = adapter.getDailyNotesFolder();

      expect(result).toBeNull();
    });

    it('should return null when folder is not set', () => {
      const mockApp = {
        // @ts-ignore
        internalPlugins: {
          plugins: {
            'daily-notes': {
              enabled: true,
              instance: {
                options: {
                  folder: '',
                },
              },
            },
          },
        },
      };

      const adapter = new ObsidianSettingsAdapter(mockApp);
      const result = adapter.getDailyNotesFolder();

      expect(result).toBeNull();
    });

    it('should return null when folder is whitespace only', () => {
      const mockApp = {
        // @ts-ignore
        internalPlugins: {
          plugins: {
            'daily-notes': {
              enabled: true,
              instance: {
                options: {
                  folder: '   ',
                },
              },
            },
          },
        },
      };

      const adapter = new ObsidianSettingsAdapter(mockApp);
      const result = adapter.getDailyNotesFolder();

      expect(result).toBeNull();
    });

    it('should return null when internalPlugins throws error', () => {
      const mockApp = {
        // @ts-ignore
        get internalPlugins() {
          throw new Error('Access denied');
        },
      };

      const adapter = new ObsidianSettingsAdapter(mockApp);
      const result = adapter.getDailyNotesFolder();

      expect(result).toBeNull();
    });

    it('should trim folder path', () => {
      const mockApp = {
        // @ts-ignore
        internalPlugins: {
          plugins: {
            'daily-notes': {
              enabled: true,
              instance: {
                options: {
                  folder: '  Daily Notes  ',
                },
              },
            },
          },
        },
      };

      const adapter = new ObsidianSettingsAdapter(mockApp);
      const result = adapter.getDailyNotesFolder();

      expect(result).toBe('Daily Notes');
    });
  });

  describe('isDailyNotesPluginConfigured', () => {
    it('should return true when plugin is configured', () => {
      const mockApp = {
        // @ts-ignore
        internalPlugins: {
          plugins: {
            'daily-notes': {
              enabled: true,
              instance: {
                options: {
                  folder: 'Daily Notes',
                },
              },
            },
          },
        },
      };

      const adapter = new ObsidianSettingsAdapter(mockApp);
      const result = adapter.isDailyNotesPluginConfigured();

      expect(result).toBe(true);
    });

    it('should return false when plugin is not configured', () => {
      const mockApp = {
        // @ts-ignore
        internalPlugins: {
          plugins: {},
        },
      };

      const adapter = new ObsidianSettingsAdapter(mockApp);
      const result = adapter.isDailyNotesPluginConfigured();

      expect(result).toBe(false);
    });
  });
});
