import test from 'node:test';
import assert from 'node:assert/strict';

test('pretend hands is never restored from saved settings', async () => {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  };
  const { loadSettings, saveSettings, DEFAULT_SETTINGS } = await import('../src/settings');
  saveSettings({ ...DEFAULT_SETTINGS, demoMode: true, sensitivity: 0.9 });
  const s = loadSettings();
  assert.equal(s.demoMode, false);
  assert.equal(s.sensitivity, 0.9);
  delete (globalThis as any).localStorage;
});
