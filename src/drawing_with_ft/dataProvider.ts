/**
 * Exposes a single method `fetchData` that returns an array of Position's
 * Currently reads data from files in the public folder
 */

import { Position } from "../gameplay/positioning";
import { DrawingData, IDataProvider } from "./drawing";

export class DefaultDataProvider implements IDataProvider {
    private readonly DATA_FOLDER = 'drawing_data';

    public readonly resourceNames: Array<string> = ['monroe', 'david', 'monalisa', 'einstein'];

    public fetchData = async (key?: string): Promise<DrawingData> => {
        if (!(key ?? '' in this.resourceNames)) {
            key = this.resourceNames[Math.floor(Math.random() * this.resourceNames.length)];
        }

        try {
            const response = await fetch(`/${this.DATA_FOLDER}/${key}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json() as Array<Position>;
            let result = {
                points: data,
                paceFactor: 0.000613,
                snappedToTip: true,
                stopped: false,
                initialZoom: 200,
                numCircles: 250,
                fill: true,
                prefferedDt: 0.0009332,
                roundCompletedInfo: {
                    factor: 7,
                    numRounds: 1,
                    dimmed: true,
                },
                animation: {
                    zoom: {
                        wheelDelta: -0.03,
                        scale: 1.0578,
                        startFrame: 30,
                        endFrame: 500,
                    },
                    pace: {
                        wheelDelta: 0.2279,
                        startFrame: 340,
                        endFrame: 540,
                    },
                    snap: {
                        startFrame: 500,
                    },
                },
            };
            return result;
        } catch (error) {
            console.error('Error fetching the JSON file:', error);
            throw new Error('' + error);
        }
    }
}

export class UserFileDataProvider implements IDataProvider {
    private file: File;
    private fileData: DrawingData | null = null;
    constructor(file: File) {
        this.file = file;
    }

    public fetchData = async (key?: string): Promise<DrawingData> => {
        if (this.fileData) return this.fileData;

        const text = await this.file.text();
        const points = JSON.parse(text);
        this.fileData = {
            points: points,
            initialZoom: 1,
            paceFactor: 0.025,
            snappedToTip: false,
            stopped: false,
            numCircles: 250,
            fill: true,
            prefferedDt: 0.0009332,
            roundCompletedInfo: {
                factor: 7,
                numRounds: 1,
                dimmed: true,
            }
        };
        return this.fileData;
    }

}