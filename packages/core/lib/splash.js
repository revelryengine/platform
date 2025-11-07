import { LitElement, html, css } from '../deps/lit.js';

export class RevelrySplashElement extends LitElement {
    static styles = [css`
        video {
            opacity: 0;
            animation: fade 4s ease-in-out forwards paused;
            max-width: 100%;
        }

        @keyframes fade {
            0% { opacity: 0; }
            25% { opacity: 1; }
            90% { opacity: 1; }
            100% { opacity: 0; }
        }`,
    ]
    connectedCallback() {
        this.addEventListener('click', () => {
            this.shadowRoot?.querySelector('video')?.play();
        });
        super.connectedCallback();
    }

    render() {
        return html`<video autoplay src="${import.meta.resolve('./splash.webm')}" disableRemotePlayback @play="${this.#resetCSSAnimation}">`
    }

    #resetCSSAnimation() {
        const video = this.shadowRoot?.querySelector('video');
        if(video) {
            video.style.animation = 'none';
            video.offsetHeight; /* trigger reflow */
            video.style.animation = '';
            video.style.animationPlayState = 'running';
        }
    }
}

customElements.define('rev-splash', RevelrySplashElement);
