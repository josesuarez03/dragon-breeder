const BASE_URL = `http://localhost:${PORT}`;

export async function regenerateAttributes(dragonId, action) {
    try {
        const response = await fetch(`${BASE_URL}/dragon/${dragonId}/action`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: action })
        });

        const data = await response.json();

        switch (action) {
            case 'feed':
                console.log('¡Dragón alimentado! Energía restaurada.');
                break;
            case 'heal':
                console.log('¡Dragón curado! Salud restaurada.');
                break;
            case 'battle':
                console.log('¡Batalla iniciada!');
                break;
            case 'train':
                console.log('Dragon entrenado');
                break;
            case 'evolve':
                console.log('Dragón evolucionado');
                break;
        }

        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

export function feedDragon(dragonId) {
    return regenerateAttributes(dragonId, 'feed');
}

export function healDragon(dragonId) {
    return regenerateAttributes(dragonId, 'heal');
}

export function startBattle(dragonId) {
    return regenerateAttributes(dragonId, 'battle');
}

export function trainDragon(dragonId) {
    return regenerateAttributes(dragonId, 'train');
}

export function evolveDragon(dragonId) {
    return regenerateAttributes(dragonId, 'evolve');
}