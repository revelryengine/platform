import raf from 'request-animation-frame-polyfill';

global.requestAnimationFrame = raf.requestAnimationFrame;
global.cancelAnimationFrame  = raf.cancelAnimationFrame;
