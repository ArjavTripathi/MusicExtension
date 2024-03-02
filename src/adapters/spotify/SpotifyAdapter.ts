import type { ContentController, MusicServiceAdapter } from '~core/adapter';

import { SpotifyBackgroundController } from './SpotifyBackgroundController';
import { SpotifyContentController } from './SpotifyContentController';
import { SpotifyObserver } from './SpotifyContentObserver';

export const SpotifyAdapter: MusicServiceAdapter = {
  displayName: 'Spotify',
  id: 'SPOTIFY',
  baseUrl: 'https://open.spotify.com/',
  icon: '',
  urlMatches: ['*://open.spotify.com/*'],
  disabledFeatures: [],
  backgroundController: () => new SpotifyBackgroundController(),
  contentController: () => new SpotifyContentController(),
  contentObserver: (contentController: ContentController) =>
    new SpotifyObserver(contentController as SpotifyContentController)
};
