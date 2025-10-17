// src/hooks/useAutoUpdate.ts
import { useEffect } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { confirm, message } from '@tauri-apps/plugin-dialog';
import { relaunch } from '@tauri-apps/plugin-process';
import { useAuthStore } from '../store/authStore';

export function useAutoUpdate() {
  const { token } = useAuthStore();

  useEffect(() => {
    if (!token) return; // parte solo da autenticato
    let stopped = false;

    (async () => {
      try {
        await new Promise(r => setTimeout(r, 800)); // piccolo delay

        // Se la rotta richiede auth, passiamo gli header:
        const upd = await check({
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });

        console.log('[updater.check] result:', upd);

        // 204 => upd = null/undefined
        if (!upd || stopped) return;

        const ok = await confirm(
          `È disponibile la versione ${upd.version}.` +
          (upd.body ? `\n\nNote:\n${upd.body}` : '') +
          `\n\nVuoi procedere ora?`,
          { title: 'Aggiornamento disponibile', kind: 'info', okLabel: 'Installa', cancelLabel: 'Più tardi' }
        );
        if (!ok || stopped) return;

        await upd.downloadAndInstall(); // scarica + installa

        await message('Aggiornamento installato. Riavvio in corso…', { title: 'Aggiornamento', kind: 'info' });
        await relaunch();
      } catch (e) {
        console.error('[updater] errore:', e);
        await message(String(e), { title: 'Errore aggiornamento', kind: 'error' });
      }
    })();

    return () => { stopped = true; };
  }, [token]);
}
