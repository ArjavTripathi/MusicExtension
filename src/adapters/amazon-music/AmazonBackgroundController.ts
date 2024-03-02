import type {
  BackgroundController,
  SearchInput,
  SearchResult
} from '~core/adapter';

import type { AmznMusic } from './types';

const SEARCH_ENDPOINT = 'https://na.mesk.skill.music.a2z.com/api/showSearch';

export class AmazonBackgroundController implements BackgroundController {
  public async search(input: SearchInput): Promise<SearchResult[]> {
    const query = `${input.name} ${input.artistName}`;

    const config = await this._fetchConfig();

    const headers = {
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'cache-control': 'no-cache',
      'content-type': 'text/plain;charset=UTF-8',
      pragma: 'no-cache',
      'sec-ch-ua':
        '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'cross-site'
    };

    const filter = JSON.stringify({ IsLibrary: ['false'] });
    const keyword = JSON.stringify({
      interface:
        'Web.TemplatesInterface.v1_0.Touch.SearchTemplateInterface.SearchKeywordClientInformation',
      keyword: ''
    });
    const userHash = JSON.stringify({ level: 'LIBRARY_MEMBER' });

    const body = {
      filter,
      headers: this._createBodyHeaders(config, query),
      keyword,
      userHash,
      suggestedKeyword: query
    };

    const response = await fetch(SEARCH_ENDPOINT, {
      headers,
      referrer: 'https://music.amazon.com/',
      referrerPolicy: 'strict-origin-when-cross-origin',
      body: JSON.stringify(body),
      method: 'POST',
      mode: 'cors',
      credentials: 'omit'
    }).then((res) => res.json());

    const widgets = response?.methods?.[0]?.template?.widgets;
    const songsWidget = widgets?.find(
      (widget: any) => widget.header === 'Songs'
    );
    const tracks = songsWidget?.items;

    const searchResults = tracks?.map((track: any) => ({
      name: track.primaryText.text,
      artistName: track.secondaryText,
      link: `https://music.amazon.com${track.primaryLink.deeplink}`
    }));

    return searchResults;
  }

  private async _fetchConfig(): Promise<AmznMusic['appConfig']> {
    const htmlResponse = await fetch('https://music.amazon.com/', {
      credentials: 'omit'
    }).then((res) => res.text());

    const accessTokenMatch = htmlResponse.matchAll(
      /\"accessToken\": \"(.*)\",?/g
    );
    const accessToken = accessTokenMatch.next().value[1];

    const customerIdMatch = htmlResponse.matchAll(
      /\"customerId\": \"(.*)\",?/g
    );
    const customerId = customerIdMatch.next().value[1];

    const csrfTokenMatch = htmlResponse.matchAll(/\"token\": \"(.*)\",?/g);
    const csrfToken = csrfTokenMatch.next().value[1];

    const csrfTsMatch = htmlResponse.matchAll(/\"ts\": \"(.*)\",?/g);
    const csrfTs = csrfTsMatch.next().value[1];

    const csrfRndMatch = htmlResponse.matchAll(/\"rnd\": \"(.*)\",?/g);
    const csrfRnd = csrfRndMatch.next().value[1];

    const deviceIdMatch = htmlResponse.matchAll(/\"deviceId\": \"(.*)\",?/g);
    const deviceId = deviceIdMatch.next().value[1];

    const displayLanguageMatch = htmlResponse.matchAll(
      /\"displayLanguage\": \"(.*)\",?/g
    );
    const displayLanguage = displayLanguageMatch.next().value[1];

    const sessionIdMatch = htmlResponse.matchAll(/\"sessionId\": \"(.*)\",?/g);
    const sessionId = sessionIdMatch.next().value[1];

    const versionMatch = htmlResponse.matchAll(/\"version\": \"(.*)\",?/g);
    const version = versionMatch.next().value[1];

    return {
      accessToken,
      csrf: {
        token: csrfToken,
        ts: csrfTs,
        rnd: csrfRnd
      },
      deviceId,
      displayLanguage,
      sessionId,
      customerId,
      version
    };
  }

  private _createBodyHeaders(config: AmznMusic['appConfig'], query: string) {
    const csrf = JSON.stringify({
      interface: 'CSRFInterface.v1_0.CSRFHeaderElement',
      token: config.csrf.token,
      timestamp: config.csrf.ts,
      rndNonce: config.csrf.rnd
    });

    const headers = {
      'x-amzn-affiliate-tags': '',
      'x-amzn-application-version': config.version,
      'x-amzn-authentication':
        '{"interface":"ClientAuthenticationInterface.v1_0.ClientTokenElement","accessToken":""}',
      'x-amzn-csrf': csrf,
      'x-amzn-currency-of-preference': 'USD',
      'x-amzn-device-family': 'WebPlayer',
      'x-amzn-device-height': '1080',
      'x-amzn-device-id': config.sessionId,
      'x-amzn-device-language': config.displayLanguage,
      'x-amzn-device-model': 'WEBPLAYER',
      'x-amzn-device-time-zone': 'America/Los_Angeles',
      'x-amzn-device-width': '1920',
      'x-amzn-feature-flags': 'hd-supported,uhd-supported',
      'x-amzn-music-domain': 'music.amazon.com',
      'x-amzn-os-version': '1.0',
      'x-amzn-page-url': `https://music.amazon.com/search/${query.replaceAll(
        ' ',
        '+'
      )}?filter=IsLibrary%257Cfalse&sc=none`,
      'x-amzn-ref-marker': '',
      'x-amzn-referer': '',
      'x-amzn-request-id': this._generateRequestId(),
      'x-amzn-session-id': config.sessionId,
      'x-amzn-timestamp': Date.now().toString(),
      'x-amzn-user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'x-amzn-video-player-token': '',
      'x-amzn-weblab-id-overrides': ''
    };

    return JSON.stringify(headers);
  }

  private _generateRequestId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
