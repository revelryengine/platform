### Add-Ons

###  Custom Views

Custom views can be added via the RevEditorView custom element class.

```js
import { html, css, RevViewElement } from '@editor/lib/ui/view.js';


export class RevViewCustomElement extends RevViewElement {
    //The name of the view as it will appear in the view selection menu.
    static label = 'Custom';

    // The path to an svg icon that will appear in the view selection menu.
    static icon  = './path-to-icon.svg';

    //The group to add the view to in the view selection menu. Defaults to 'General'.
    static group = 'Custom Group';

    static properties = {
        ...super.properties,
        /** custom lit reactive properties */
    }

    static styles = [
        ...super.styles,
        css`
            /* custom css */
        `,
    ];

    renderView() {
        return html`<p>HTML Content here</p>`;
    }

    /**
     *  @see `Adding Menu Items to a View` section
     */
    renderMenuIems() {
        return html`
            <li>
                <!-- custom menu item -->
            </li>
            <li>
                <!-- custom menu item -->
            </li>
        `
    }
}

RevViewElement.register('custom', RevViewCustomElement);
```


### Adding Menu Items to a View

Every view will have a view selection drop down in the menu by default. To add additional items, you can render them using the `renderMenuItems` method and return a series of `<li>` elements.


#### Menu List (`<rev-menu>`)

The `<rev-menu>` element can be used to add a standard menu list item. It must only contain `<rev-mi>` elements.

#### Attributes

`label`
  The text label for the menu

#### Example

```js
export class RevViewCustomElement extends RevViewElement {
   renderMenuItems() {
        return html`
            <li>
                <rev-menu label="Select">
                    <rev-mi label="Select All"  @click="${() => console.log('Select All')}" ></rev-mi>
                    <rev-mi label="Select None" @click="${() => console.log('Select None')}"></rev-mi>
                </rev-menu>
            </li>
        `;
   }
}
```

#### Menu Item (`<rev-mi>`)

The `<rev-mi>`element is used to represent an item in a menu list. It must be contained in a `<rev-menu>` element. It may contain other `<rev-mi>` children to create a submenu. No other children are allowed.

#### Attributes

`label`
  The text label for the item

`icon`
  A path to the SVG icon. It will be rendered to the left of the label.

#### Example

```js
export class RevViewCustomElement extends RevViewElement {
   renderMenuItems() {
        return html`
            <li>
                <rev-menu label="Select">
                    <rev-mi label="Select All"  icon="./path-to-icon.svg" @click="${() => console.log('Select All')}" ></rev-mi>
                    <rev-mi label="Select None" icon="./path-to-icon.svg" @click="${() => console.log('Select None')}"></rev-mi>

                    <rev-mi label="Sub Menu">
                        <rev-mi label="Sub Item" @click="${() => console.log('Sub Item')}"></rev-mi>

                        <rev-mi label="Sub Sub Menu">
                            <rev-mi label="Sub Sub Item" @click="${() => console.log('Sub Sub Item')}"></rev-mi>

                            <rev-mi label="Sub Sub Sub Menu">
                                <rev-mi label="Sub Sub Sub Item"  icon="./path-to-icon.svg" @click="${() => console.log('Sub Sub Sub Item')}" ></rev-mi>
                                <rev-mi label="Sub Sub Sub Item2" icon="./path-to-icon.svg" @click="${() => console.log('Sub Sub Sub Item2')}"></rev-mi>
                            </rev-mi>
                        </rev-mi>
                    </rev-mi>
                </rev-menu>
            </li>
        `;
        `
   }
}
```

#### Menu Select (`<rev-select>`)

The `<rev-menu>` element can be used to add a standard menu list item. It must only contain `<rev-mi>` elements.

#### Attributes

`label`
  The text label for the menu

#### Example

```js
export class RevViewCustomElement extends RevViewElement {
   renderMenuItems() {
        return html`
            <li>
                <rev-menu label="Select">
                    <rev-mi label="Select All"  @click="${() => console.log('Select All')}" ></rev-mi>
                    <rev-mi label="Select None" @click="${() => console.log('Select None')}"></rev-mi>
                </rev-menu>
            </li>
        `;
   }
}
```
