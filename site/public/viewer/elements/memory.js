import { LitElement, html, css } from 'revelryengine/deps/lit.js';

import { getWebGPUMemoryUsage } from 'revelryengine/deps/memory.js';

/**
 * @import { RevGLTFViewerElement } from './viewer.js';
 */

class RevGLTFMemoryStats extends LitElement {
    /**
     * @override
     */
    static properties = {
        viewer:        { type: Object },
        total:         { type: Number, reflect: true },
        texture:       { type: Number, reflect: true },
        buffer:        { type: Number, reflect: true },
        renderBbuffer: { type: Number, reflect: true },
        drawingbuffer: { type: Number, reflect: true },
    }

    /**
     * @override
     */
    static styles = [css`
        :host {
            position: absolute;
            background: rgba(0, 0, 0, 0.75);;
            top: 0;
            right: 0;
            padding: 5px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-column-gap: 0.5em;
            margin: 0;
            font-size: 12px;
        }

        h4, hr {
            grid-column: 1 / -1;
            margin: 0;
            font-weight: bold;
        }

        div.mb {
            text-align: right;
        }
    `];

    viewer = /** @type {RevGLTFViewerElement} */({});

    updateMemory() {
        const { viewer } = this;
        const { memory = {} } = (viewer.renderer?.mode === 'webgpu' ? getWebGPUMemoryUsage() : viewer.renderer?.gal.context.getExtension('GMAN_webgl_memory').getMemoryInfo()) ?? {};
        this.total         = memory.total ?? 0;
        this.texture       = memory.texture ?? 0;
        this.buffer        = memory.buffer ?? 0;
        this.canvas        = memory.canvas ?? 0;
        this.renderbuffer  = memory.renderbuffer ?? 0;
        this.drawingbuffer = memory.drawingbuffer ?? 0;
    }

    /**
     * @override
     */
    render(){
        const { viewer } = this;

        return html`
            <h4>Memory</h4>
            <hr>
            <div>Texture:</div><div class="mb">${(this.texture / 1000000).toFixed(3)} Mb</div>
            <div>Buffer:</div><div class="mb">${(this.buffer / 1000000).toFixed(3)} Mb</div>
            ${viewer?.renderer?.mode === 'webgpu' ? html`
                <div>Canvas:</div><div class="mb">${(this.canvas / 1000000).toFixed(3)} Mb</div>
            ` : html`
                <div>Render Buffer:</div><div class="mb">${(this.renderbuffer / 1000000).toFixed(3)} Mb</div>
                <div>Drawing Buffer:</div><div class="mb">${(this.drawingbuffer / 1000000).toFixed(3)} Mb</div>
            `}
            <hr>
            <div>Total:</div><div class="mb">${(this.total / 1000000).toFixed(3)} Mb</div>
        `;
    }
}

customElements.define('rev-memory-stats', RevGLTFMemoryStats);


