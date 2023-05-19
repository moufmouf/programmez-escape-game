/// <reference types="@workadventure/iframe-api-typings" />

console.log('Script started successfully');

const buttons = {
    "button1": { x: 3, y: 11, color: 'red', pressed: false },
    "button2": { x: 6, y: 11, color: 'red', pressed: false },
    "button3": { x: 8, y: 4, color: 'red', pressed: false },
    "button4": { x: 12, y: 12, color: 'red', pressed: false },
    "button5": { x: 6, y: 14, color: 'blue', pressed: false },
    "button6": { x: 10, y: 4, color: 'blue', pressed: false },
    "button7": { x: 15, y: 12, color: 'blue', pressed: false },
    "button8": { x: 15, y: 14, color: 'blue', pressed: false },
}

interface TileDescriptor {
    x: number;
    y: number;
    tile: number | string | null;
    layer: string;
}

// Attendons l'initialisation de l'API
WA.onInit().then(async () => {
    console.log('Scripting API ready');
    // Afin de pouvoir lire les variables des autres joueurs, nous devons activer le tracking des joueurs.
    await WA.players.configureTracking({
        players: true,
    });

    for (const [btnName, {x, y}] of Object.entries(buttons)) {
        WA.room.area.create({
            name: btnName,
            x: x * 32,
            y: y * 32,
            width: 32,
            height: 32,
        });
        WA.room.area.onEnter(btnName).subscribe(() => {
            WA.player.state.saveVariable("buttonPressed", btnName, {
                persist: false,
                public: true,
            });
            updateMap();
        });
        WA.room.area.onLeave(btnName).subscribe(() => {
            WA.player.state.saveVariable("buttonPressed", undefined, {
                persist: false,
                public: true,
            });
            updateMap();
        });
    }

    WA.players.onVariableChange('buttonPressed').subscribe(value => {
        console.log("VARIABLE CHANGED", value);
        updateMap();
    });

    updateMap();

}).catch(e => console.error(e));

function updateMap() {
    // Reset pressed state
    for (const button of Object.values(buttons)) {
        button.pressed = false;
    }

    let nbRedPressed = 0;
    let nbBluePressed = 0;

    const players = [...WA.players.list(), WA.player];
    for (const player of players) {
        const buttonPressed = player.state.buttonPressed;
        if (typeof buttonPressed === 'string' && buttonPressed in buttons) {
            buttons[buttonPressed].pressed = true;
            if (buttons[buttonPressed].color === 'red') {
                nbRedPressed++;
            }
            if (buttons[buttonPressed].color === 'blue') {
                nbBluePressed++;
            }
        }
    }

    displayButtons();

    if (nbRedPressed >= 2) {
        WA.room.showLayer('doors/red_door_opened');
        WA.room.hideLayer('doors/red_door_closed');
    } else {
        WA.room.hideLayer('doors/red_door_opened');
        WA.room.showLayer('doors/red_door_closed');
    }
    if (nbBluePressed >= 2) {
        WA.room.showLayer('doors/blue_door_opened');
        WA.room.hideLayer('doors/blue_door_closed');
    } else {
        WA.room.hideLayer('doors/blue_door_opened');
        WA.room.showLayer('doors/blue_door_closed');
    }
}

function displayButtons() {
    let tiles: TileDescriptor[] = [];
    for (const {x, y, color, pressed} of Object.values(buttons)) {
        tiles.push({ x, y, tile: color + (pressed ? '_enabled' : '_disabled'), layer: 'buttons' });
    }
    WA.room.setTiles(tiles);
}

export {};
