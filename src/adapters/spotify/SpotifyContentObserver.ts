import type { ContentObserver } from '~core/adapter';
import { sendToBackground } from '~core/messaging';
import type { ReconnectingHub } from '~core/messaging/hub';
import {
  updateMusicServiceTabCurrentTrack,
  updateMusicServiceTabPlayerState
} from '~store/slices/musicServiceTabs';
import { dispatchFromContent } from '~util/store';
import { waitForElement } from '~util/waitForElement';

import type { SpotifyContentController } from './SpotifyContentController';

export class SpotifyObserver implements ContentObserver {
  constructor(
    private _controller: SpotifyContentController,
    private _hub: ReconnectingHub
  ) {}

  public async observe(): Promise<void> {
    await waitForElement('.player-controls');

    this._setupPlayerStateObserver();
    await this._setupSongInfoObserver();
  }

  private _setupPlayerStateObserver() {
    const playerStateObserver = new MutationObserver(async () => {
      await this._handlePlaybackUpdated();
    });

    const playPauseButtonElement = document.querySelector(
      'button[data-testid="control-button-playpause"]'
    );
    if (playPauseButtonElement) {
      playerStateObserver.observe(playPauseButtonElement, {
        attributeFilter: ['aria-label']
      });
    }

    const playbackProgressBarElement = document.querySelector(
      'div[data-testid="playback-progressbar"]'
    );
    const playbackProgressBarInput = playbackProgressBarElement?.querySelector(
      'input[type="range"]'
    );
    if (playbackProgressBarInput) {
      playerStateObserver.observe(playbackProgressBarInput, {
        attributeFilter: ['value']
      });
    }

    const volumeContainerElement = document.querySelector(
      'div[data-testid="volume-bar"]'
    );
    const volumeInputElement = volumeContainerElement?.querySelector(
      'input[type="range"]'
    );
    if (volumeInputElement) {
      playerStateObserver.observe(volumeInputElement, {
        attributeFilter: ['value']
      });
    }

    const repeatButton = document.querySelector(
      'button[data-testid="control-button-repeat"]'
    );
    if (repeatButton) {
      playerStateObserver.observe(repeatButton, {
        attributeFilter: ['aria-label']
      });
    }
  }

  private async _setupSongInfoObserver() {
    const songInfoObserver = new MutationObserver(async () => {
      await this._handleTrackUpdated();
    });

    const nowPlayingWidgetSelector = 'div[data-testid="now-playing-widget"]';
    const nowPlayingWidget = await waitForElement(nowPlayingWidgetSelector);
    if (nowPlayingWidget) {
      songInfoObserver.observe(nowPlayingWidget, {
        attributeFilter: ['aria-label']
      });
    }

    const addToLibraryButtonSelector = 'button[data-testid="add-button"]';
    const addToLibraryButton = nowPlayingWidget.querySelector(
      addToLibraryButtonSelector
    );
    if (addToLibraryButton) {
      songInfoObserver.observe(addToLibraryButton, {
        attributeFilter: ['aria-checked']
      });
    }

    await this._handleTrackUpdated();
  }

  /**
   * The Spotify API can take more time than the mutation observer to update the current
   * song info. This method will retry up to 5 times to get the current song info that
   * matches the UI's song info.
   */
  private async _handleTrackUpdated(): Promise<void> {
    await this._updateCurrentTrack();

    setTimeout(async () => {
      await this._updateCurrentTrack();
    }, 5000);
  }

  private async _updateCurrentTrack(): Promise<void> {
    const currentTrack = await this._controller.getCurrentTrack();

    const tab = await sendToBackground<undefined, chrome.tabs.Tab>({
      name: 'GET_SELF_TAB'
    });

    dispatchFromContent(
      updateMusicServiceTabCurrentTrack({
        tabId: tab.id!,
        currentTrack: currentTrack ?? undefined
      })
    );
  }

  private async _handlePlaybackUpdated(): Promise<void> {
    const playerState = await this._controller.getPlayerState();

    const tab = await sendToBackground<undefined, chrome.tabs.Tab>({
      name: 'GET_SELF_TAB'
    });

    dispatchFromContent(
      updateMusicServiceTabPlayerState({
        tabId: tab.id!,
        playerState: playerState ?? undefined
      })
    );
  }
}
