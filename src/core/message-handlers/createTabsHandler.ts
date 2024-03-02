import type { PlasmoMessaging } from '@plasmohq/messaging';

import { updateMusicServiceTab } from '~store/slices/musicServiceTabs';
import { type MusicServiceTab, NotReadyReason } from '~types';
import { TabsMessage } from '~types/TabsMessage';
import type { ReduxHub } from '~util/connectToReduxHub';
import { getMusicServiceFromUrl } from '~util/musicService';

import type { MusicServiceObserver } from '../../../services/MusicServiceObserver';
import type { MusicServicePlaybackController } from '../../../services/MusicServicePlaybackController';

export const createTabsHandler = (
  controller: MusicServicePlaybackController,
  observer: MusicServiceObserver,
  hub: ReduxHub
) => {
  hub.addListener(async (message) => {
    switch (message?.name) {
      case TabsMessage.UPDATE_TAB:
        await handleUpdateTab(controller, hub);
        break;

      case TabsMessage.SET_SELECTED_TAB:
        await handleSetSelectedTab(observer, hub, message);
        break;
    }
  });
};

const handleUpdateTab = async (
  controller: MusicServicePlaybackController,
  hub: ReduxHub
): Promise<void> => {
  const currentTrack = await controller.getCurrentTrack();
  const playerState = await controller.getPlayerState();
  const tab = await hub.asyncPostMessage<chrome.tabs.Tab>({
    name: 'GET_SELF_TAB'
  });

  if (!tab.url) {
    return;
  }

  const musicService = getMusicServiceFromUrl(tab.url);

  if (!musicService) {
    return;
  }

  const musicServiceTab: MusicServiceTab = {
    tabId: tab.id!,
    musicService,
    currentTrack,
    playerState,
    autoPlayReady: true
  };

  hub.dispatch(updateMusicServiceTab(musicServiceTab));
};

const handleSetSelectedTab = async (
  observer: MusicServiceObserver,
  hub: ReduxHub,
  message: PlasmoMessaging.Request<string, number>
): Promise<void> => {
  const tab = await hub.asyncPostMessage<chrome.tabs.Tab>({
    name: 'GET_SELF_TAB'
  });

  if (tab.id === message.body) {
    observer.resume();
  } else {
    observer.pause({ currentTrack: true, playerState: true });
  }
};
