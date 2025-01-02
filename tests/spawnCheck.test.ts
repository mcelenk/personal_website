import { Hex } from "../src/gameplay/hex";
import { Obj } from "../src/gameplay/object";
import { RandomGenerator, SpawnCheck } from "../src/gameplay/spawnCheck";

describe('testing SpawnCheck class', () => {
    test('SpawnTree sets a Palm on the target hex when it is near "water"', () => {
        function* mockGetNeighbours(hex: Hex): Generator<Hex> {
            // yielding an inactive hex
            yield new Hex(0, 0, false, 1, Obj.NONE, 0);
        }

        const spawnCheck = new SpawnCheck(<RandomGenerator>{
            random: () => {
                return 1;
            }
        }, mockGetNeighbours);
        const hex = new Hex(1, 0, true, 1, Obj.NONE, 0);
        spawnCheck.spawnTree(hex);
        expect(hex.getObjectInside() === Obj.PALM);

    });

    test('SpawnTree sets a Pine on the target hex when it is NOT near "water"', () => {
        function* mockGetNeighbours(hex: Hex): Generator<Hex> {
            // yielding an active hex
            yield new Hex(0, 0, true, 1, Obj.NONE, 0);
        }

        const spawnCheck = new SpawnCheck(<RandomGenerator>{
            random: () => {
                return 1;
            }
        }, mockGetNeighbours);
        const hex = new Hex(1, 0, true, 1, Obj.NONE, 0);
        spawnCheck.spawnTree(hex);
        expect(hex.getObjectInside() === Obj.PINE);
    });

    test('SpawnTree sets a Pine on the target hex when it has no neighbouring hexes', () => {
        function* mockGetNeighbours(hex: Hex): Generator<Hex> {
        }

        const spawnCheck = new SpawnCheck(<RandomGenerator>{
            random: () => {
                return 1;
            }
        }, mockGetNeighbours);
        const hex = new Hex(1, 0, true, 1, Obj.NONE, 0);
        spawnCheck.spawnTree(hex);
        expect(hex.getObjectInside() === Obj.PINE);
    });

    test('CanSpawnPalmOnHex returns false when the hex is not active', () => {
        function* mockGetNeighbours(hex: Hex): Generator<Hex> {
        }

        const spawnCheck = new SpawnCheck(<RandomGenerator>{
            random: () => {
                return 0;
            }
        }, mockGetNeighbours);
        const hex = new Hex(1, 0, false, 1, Obj.NONE, 0);
        expect(spawnCheck.canSpawnPalmOnHex(hex)).toBe(false);
    });

    test('CanSpawnPalmOnHex returns false when the hex is not free', () => {
        function* mockGetNeighbours(hex: Hex): Generator<Hex> {
        }

        const spawnCheck = new SpawnCheck(<RandomGenerator>{
            random: () => {
                return 0;
            }
        }, mockGetNeighbours);
        const hex = new Hex(1, 0, true, 1, Obj.TOWN, 0);
        expect(spawnCheck.canSpawnPalmOnHex(hex)).toBe(false);
    });

    test('CanSpawnPalmOnHex returns false when the hex has no "near water" neighbour', () => {
        function* mockGetNeighbours(hex: Hex): Generator<Hex> {
        }

        const spawnCheck = new SpawnCheck(<RandomGenerator>{
            random: () => {
                return 0;
            }
        }, mockGetNeighbours);
        const hex = new Hex(1, 0, true, 1, Obj.NONE, 0);
        expect(spawnCheck.canSpawnPalmOnHex(hex)).toBe(false);
    });

    test('CanSpawnPalmOnHex returns false when the hex has no neighbouring hex with a palm', () => {
        function* mockGetNeighbours(hex: Hex): Generator<Hex> {
            yield new Hex(0, 0, false, 1, Obj.NONE, 0);
            yield new Hex(0, 1, true, 1, Obj.NONE, 0);
        }

        const spawnCheck = new SpawnCheck(<RandomGenerator>{
            random: () => {
                return 0;
            }
        }, mockGetNeighbours);
        const hex = new Hex(1, 0, true, 1, Obj.NONE, 0);
        expect(spawnCheck.canSpawnPalmOnHex(hex)).toBe(false);
    });

    test('CanSpawnPalmOnHex returns false when the random number is >= 0.3', () => {
        function* mockGetNeighbours(hex: Hex): Generator<Hex> {
            yield new Hex(0, 0, false, 1, Obj.NONE, 0);
            yield new Hex(0, 1, true, 1, Obj.PALM, 0);
        }

        const spawnCheck = new SpawnCheck(<RandomGenerator>{
            random: () => {
                return 0.3;
            }
        }, mockGetNeighbours);
        const hex = new Hex(1, 0, true, 1, Obj.NONE, 0);
        expect(spawnCheck.canSpawnPalmOnHex(hex)).toBe(false);
    });

    test('CanSpawnPalmOnHex returns true when none of the cases above applies', () => {
        function* mockGetNeighbours(hex: Hex): Generator<Hex> {
            yield new Hex(0, 0, false, 1, Obj.NONE, 0);
            yield new Hex(0, 1, true, 1, Obj.PALM, 0);
        }

        const spawnCheck = new SpawnCheck(<RandomGenerator>{
            random: () => {
                return 0.29;
            }
        }, mockGetNeighbours);
        const hex = new Hex(1, 0, true, 1, Obj.NONE, 0);
        expect(spawnCheck.canSpawnPalmOnHex(hex)).toBe(true);
    });

    test('CanSpawnPineOnHex returns false when the hex is not active', () => {
        function* mockGetNeighbours(hex: Hex): Generator<Hex> {
            yield new Hex(0, 0, true, 1, Obj.PALM, 0);
            yield new Hex(0, 1, true, 1, Obj.PINE, 0);
        }

        const spawnCheck = new SpawnCheck(<RandomGenerator>{
            random: () => {
                return 0;
            }
        }, mockGetNeighbours);
        const hex = new Hex(1, 0, false, 1, Obj.NONE, 0);
        expect(spawnCheck.canSpawnPineOnHex(hex)).toBe(false);
    });

    test('CanSpawnPineOnHex returns false when the hex is not free', () => {
        function* mockGetNeighbours(hex: Hex): Generator<Hex> {
            yield new Hex(0, 0, true, 1, Obj.PALM, 0);
            yield new Hex(0, 1, true, 1, Obj.PINE, 0);
        }

        const spawnCheck = new SpawnCheck(<RandomGenerator>{
            random: () => {
                return 0;
            }
        }, mockGetNeighbours);
        const hex = new Hex(1, 0, true, 1, Obj.TOWN, 0);
        expect(spawnCheck.canSpawnPineOnHex(hex)).toBe(false);
    });

    test('CanSpawnPineOnHex returns false when it doesn\'t have at least two neighbours with trees in them', () => {
        function* mockGetNeighbours(hex: Hex): Generator<Hex> {
            yield new Hex(0, 0, true, 1, Obj.PINE, 0);
        }

        const spawnCheck = new SpawnCheck(<RandomGenerator>{
            random: () => {
                return 0;
            }
        }, mockGetNeighbours);
        const hex = new Hex(1, 0, true, 1, Obj.NONE, 0);
        expect(spawnCheck.canSpawnPineOnHex(hex)).toBe(false);
    });

    test('CanSpawnPineOnHex returns false when the hex has no neighbouring hex with a pine', () => {
        function* mockGetNeighbours(hex: Hex): Generator<Hex> {
            yield new Hex(0, 0, true, 1, Obj.PALM, 0);
            yield new Hex(0, 1, true, 1, Obj.PALM, 0);
        }

        const spawnCheck = new SpawnCheck(<RandomGenerator>{
            random: () => {
                return 0;
            }
        }, mockGetNeighbours);
        const hex = new Hex(1, 0, true, 1, Obj.NONE, 0);
        expect(spawnCheck.canSpawnPineOnHex(hex)).toBe(false);
    });

    test('CanSpawnPineOnHex returns false when the random number is >= 0.2', () => {
        function* mockGetNeighbours(hex: Hex): Generator<Hex> {
            yield new Hex(0, 0, true, 1, Obj.PALM, 0);
            yield new Hex(0, 1, true, 1, Obj.PINE, 0);
        }

        const spawnCheck = new SpawnCheck(<RandomGenerator>{
            random: () => {
                return 0.2;
            }
        }, mockGetNeighbours);
        const hex = new Hex(1, 0, true, 1, Obj.NONE, 0);
        expect(spawnCheck.canSpawnPineOnHex(hex)).toBe(false);
    });

    test('CanSpawnPineOnHex returns true when none of the cases above applies', () => {
        function* mockGetNeighbours(hex: Hex): Generator<Hex> {
            yield new Hex(0, 0, true, 1, Obj.PALM, 0);
            yield new Hex(0, 1, true, 1, Obj.PINE, 0);
        }

        const spawnCheck = new SpawnCheck(<RandomGenerator>{
            random: () => {
                return 0.199;
            }
        }, mockGetNeighbours);
        const hex = new Hex(1, 0, true, 1, Obj.NONE, 0);
        expect(spawnCheck.canSpawnPineOnHex(hex)).toBe(true);
    });
});