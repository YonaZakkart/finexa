import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect, useState } from 'react';
import { useUiStore } from '@/stores/ui.store';
import { UpdatePrompt } from './UpdatePrompt';

export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  const setUpdateAvailable = useUiStore((state) => state.setUpdateAvailable);
  const dismissUpdate = useUiStore((state) => state.dismissUpdate);
  const updateAvailable = useUiStore((state) => state.updateAvailable);
  const updateDismissed = useUiStore((state) => state.updateDismissed);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (needRefresh) {
      setUpdateAvailable(true);
    }
  }, [needRefresh, setUpdateAvailable]);

  const handleUpdate = async () => {
    setIsUpdating(true);

    try {
      await updateServiceWorker(true);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <UpdatePrompt
      visible={updateAvailable && !updateDismissed}
      isUpdating={isUpdating}
      onUpdate={() => void handleUpdate()}
      onDismiss={() => {
        setNeedRefresh(false);
        dismissUpdate();
      }}
    />
  );
}
