import { LitElement, html, css, repeat } from '../../deps/lit.js';

/**
 * @import { TemplateResult } from '../../deps/lit.js';
 */

export class RevGLTFViewerToast extends LitElement {
    /**
     * @override
     */
    static properties = {
        messages: { type: Array },
    }

    /**
     * @override
     */
    static styles = [css`
            :host {
                position: absolute;
                display: flex;
                flex-direction: row;
                justify-content: center;
                align-items: center;
                pointer-events: none;
            }

            .message {
                background: var(--primary);
                padding: 8px;
                border-radius: 5px;
                text-align: center;
                user-select: none;
            }

            .message:first-child {
                animation: fadeIn 0.2s, fadeOut 0.2s;
                animation-delay: 0s, var(--time);
            }

            .message:not(:first-child) {
                display: none;
                animation: none;
            }

            @keyframes fadeIn {
                0% {
                    opacity: 0;
                }
                100% {
                    opacity: 1;
                }
            }
            @keyframes fadeOut {
                0% {
                    opacity: 1;
                }
                100% {
                    opacity: 0;
                }
            }

            a {
                text-decoration: none;
                color: var(--theme-color);
            }
        `
    ];

    /**
     * @type { Array<{ label: string, content: TemplateResult, time: number }> }
     */
    messages = [];

    /**
     * @override
     */
    render() {
        return html`${repeat(this.messages, ({ label }) => label, ({ content, time }) => {
            return html`<div class="message" @animationend="${(/** @type {AnimationEvent} */e) => this.handleAnimationEnd(e)}" style="--time: ${time}ms;">${content ?? ''}</div>`
        })}`;
    }

    /**
     *
     * @param {AnimationEvent} e
     */
    handleAnimationEnd(e) {
        if(e.animationName === 'fadeOut') {
            this.messages.shift();
            this.requestUpdate();
        }
    }

    /**
     * @param {string} label
     * @param {TemplateResult} content
     * @param {number} time
     */
    addMessage(label, content, time) {
        this.dismissMessage(label);
        this.messages.push({ label, content, time });
        this.requestUpdate();
    }

    /**
     * @param {string} label
     */
    dismissMessage(label) {
        this.messages = this.messages.filter(m => m.label !== label);
        this.requestUpdate();
    }

}

customElements.define('rev-gltf-viewer-toast', RevGLTFViewerToast);

export default RevGLTFViewerToast;
