/**
 * Offline support and updates. When a new version has downloaded, offer it;
 * the player chooses when to reload (the save makes reloading lossless).
 */
import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;
  return (
    <div className="update-prompt" role="status">
      <span>The vault has shifted. A new version is ready.</span>
      <button className="primary-btn" onClick={() => updateServiceWorker(true)}>
        Update
      </button>
      <button className="ghost-btn" onClick={() => setNeedRefresh(false)}>
        Later
      </button>
    </div>
  );
}
