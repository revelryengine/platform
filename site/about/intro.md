# About Revelry Engine

Welcome to Revelry Engine, a game engine designed with the belief that the Web is the ultimate platform for game development. We are committed to making game creation free and accessible for everyone, regardless of their background or experience.

## Our Philosophy

We believe in the power of the Web as a platform. The Web is universal, open, and accessible, making it the perfect platform for game development. With Revelry Engine, you can create games that can be played on any device with a web browser, reaching a global audience.

### Web Standards First

All features of the engine are backed by web standards and as such, should be browser/platform agnostic. In practice this means that if the engine doesn't run in a specific browser, it is because that browser has not yet implemented a specific web standard.

### Designed to be Build-Less

We believe that reducing the number of hurdles to get started in game development can go a long way in keeping learning developers interested. Because of this, Revelry Engine is designed to work without a build step. By not requiring a build step, we can ensure that developers spend less time configuring an environment and more time making games. This also ensure the engine code can be inspected in it's original form during runtime which fosters a better understanding of the engine code and leads to a more engaged community.

It is written as a javascript framework using standard ES Modules, but we do believe in the value of type safety so you will find JSDoc style type comments and, where necessary, supplementary `.d.ts` files to provide this without requiring any build step.

The engine provides a streamlined process for including a minimal initial download on first render. Because of the nature of video games in general, the bulk of the file size will be game assets such as textures or 3d models and not source code, therefore bundling the source code will not provide as much impact on load time compared to a typical web application.

This does not preclude developers from ultimately bundling their games in production if they so choose.


### Our Commitment to Accessibility

We believe that making games should be free and accessible for everyone. That's why Revelry Engine is free to use. We want to lower the barriers to entry for game development, allowing anyone with a passion for games to create their own.
