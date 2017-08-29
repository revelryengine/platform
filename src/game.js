import timing  from 'usertiming';

import Stage   from './stage.js';

import { browserOnly, requestTick, cancelTick, timed } from './utils.js';
import { TICK } from './symbols';

export default class Game {
    constructor(config = {}) {

        this.config = Object.assign({
            targetFrameRate: 1000 / 60,
            frameThreshold: 3000 / 60
        }, config);

        this.lastTime = 0;
        this.frameTime = 0;
        this.pauseTime = 0;

        this.stages = new Set();
    }

    @timed
    loop(hrTime) {
        this.frameTime += hrTime - this.lastTime;

        if (this.frameTime >= this.config.frameThreshold) {
            this.frameTime = this.config.frameThreshold;
        }

        while (this.frameTime >= this.config.targetFrameRate) {
            this.update(this.config.targetFrameRate);
            this.frameTime -= this.config.targetFrameRate;
        }

        this.render();

        this.lastTime = hrTime;

        this[TICK] = requestTick((hrTime) => this.loop(hrTime));
    }

    @timed
    update(deltaTime) {
        for (let stage of this.stages) {
            stage.update(deltaTime, this);
        }
    }

    @timed
    @browserOnly
    render() {
        for (let stage of this.stages) {
            stage.render(this);
        }
    }

    pause(){
        this.pauseTime = timing.now();
        cancelTick(this[TICK]);
    }

    resume(){
        this.lastTime = timing.now() - this.pauseTime;
        this[TICK] = requestTick((hrTime) => this.loop(hrTime));
    }

    boot(src){
        Stage.import(src || 'boot.js').then((stage) => {
            this.stages.add(stage);
            this.resume();
        });
    }
}