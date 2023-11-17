/* From https://github.com/justin-chu/react-fast-marquee/blob/master/src/components/Marquee.scss */

import { createGlobalStyle } from 'styled-components';

export const MarqueeStylesProvider = createGlobalStyle`
  .rfm-marquee-container {
    overflow-x: hidden;
    display: flex;
    flex-direction: row;
    position: relative;
    width: var(--width);
    transform: var(--transform);

    &:hover div {
      animation-play-state: var(--pause-on-hover);
    }

    &:active div {
      animation-play-state: var(--pause-on-click);
    }
  }

  .rfm-overlay {
    position: absolute;
    width: 100%;
    height: 100%;

    @mixin gradient {
      background: linear-gradient(to right, var(--gradient-color), transparent);
    }

    &::before,
    &::after {
      @include gradient;
      content: "";
      height: 100%;
      position: absolute;
      width: var(--gradient-width);
      z-index: 2;
      pointer-events: none;
      touch-action: none;
    }

    &::after {
      right: 0;
      top: 0;
      transform: rotateZ(180deg);
    }

    &::before {
      left: 0;
      top: 0;
    }
  }

  .rfm-marquee {
    flex: 0 0 auto;
    min-width: var(--min-width);
    z-index: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
    animation: scroll var(--duration) linear var(--delay) var(--iteration-count);
    animation-play-state: var(--play);
    animation-delay: var(--delay);
    animation-direction: var(--direction);

    @keyframes scroll {
      0% {
        transform: translateX(0%);
      }
      100% {
        transform: translateX(-100%);
      }
    }
  }

  .rfm-initial-child-container {
    flex: 0 0 auto;
    display: flex;
    min-width: auto;
    flex-direction: row;
    align-items: center;
  }

  .rfm-child {
    transform: var(--transform);
  }
`;
