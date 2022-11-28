window.mahjong = function () {
    const playAreaSpecs = {
        depth: 3,
        width: 6,
        height: 5,
        scale: 0.4,
    };
    //src image data that is gathered by inspection with paint.net
    const srcImgData = {
        tileWidth: 115,
        tileHeight: 159,
        xStart: 54,
        yStart: 34,
        xStep: 147,
        yStep: 188,
        zStep: 8,
        numRows: 4,
        numColumns: 9,
        heightenerX: 6,
        heightenerY: 6,
        heightenerWidth: 126,
        heightenerHeight: 172,
    };

    const random = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    class Dimension {
        constructor(combined, specs) {
            this.depthIndex = Math.floor(combined / (specs.width * specs.height));
            combined -= this.depthIndex * specs.width * specs.height;
            this.columnIndex = combined % specs.width;
            combined -= this.columnIndex;
            this.rowIndex = combined / specs.width;
        }
    }

    class Game {

        IMG_PATH = "images/vector-mahjong-game-tb.png";
        HEIGHTEN_PATH = "images/highten.png";

        constructor(doc, specs) {
            this.specs = specs;
            this.numTiles = specs.width * specs.height * specs.depth;
            this.canvas = doc.getElementById("myCanvas");
            this.ctx = this.canvas.getContext('2d');
            this.canvasLeft = this.canvas.offsetLeft + this.canvas.clientLeft;
            this.canvasTop = this.canvas.offsetTop + this.canvas.clientTop;

            let theGame = this;
            this.stripe = new Image();

            this.stripe.addEventListener('load', () => {
                this.drawBoard();
            }, false);

            this.stripe.src = this.IMG_PATH;
            this.heightener = new Image();
            this.heightener.addEventListener('load', () => {
                this.drawBoard();
            });
            this.heightener.src = this.HEIGHTEN_PATH;
            this.selectedTilesIndex = -1;
            this.positionTileMatching = {};


            this.canvas.addEventListener('click', function (event) {
                //console.log("In click handler");
                /*
                if (Object.keys(theGame.positionTileMatching).length === theGame.specs.width * theGame.specs.height * theGame.specs.depth) {
                    theGame.reset();
                    return;
                }*/
                //theGame.assignTile();
                //theGame.drawBoard();

                if (theGame.selectedTilesIndex >= 0) {
                    theGame.positionTileMatching[theGame.selectedTilesIndex].resetFilter();
                }

                //we want to compute Xindex and Yindex of a tile

                /* and the zIndex as well
                    playAreaSpecs.depth
                    depthIndex * srcImgData.zStep
                */
                let tilePixelPosX = event.pageX - theGame.canvasLeft - theGame.tilesStartX;
                let tilePixelPosY = event.pageY - theGame.canvasTop - theGame.tilesStartY;

                for (let zIndex = playAreaSpecs.depth - 1; zIndex >= 0; zIndex--) {

                    console.log("zIndex : ", zIndex);
                    let xIndex = Math.floor((tilePixelPosX - zIndex * srcImgData.zStep) /
                        (srcImgData.tileWidth * theGame.specs.scale));
                    console.log("xIndex : ", xIndex);

                    let yIndex = Math.floor((tilePixelPosY - zIndex * srcImgData.zStep) /
                        (srcImgData.tileHeight * theGame.specs.scale));
                    console.log("yIndex : ", yIndex);

                    // check if it is within bounds
                    if (xIndex < 0 ||
                        xIndex >= theGame.specs.width ||
                        yIndex < 0 ||
                        yIndex >= theGame.specs.height) {
                        continue;
                    }

                    let combined = xIndex +
                        yIndex * theGame.specs.width +
                        zIndex * theGame.specs.width * theGame.specs.height;

                    if (!(combined in theGame.positionTileMatching)) {
                        continue;
                    }

                    //both within bounds and there is a tile at that location
                    // now we need to check whether its left and right sides are occupied by tiles or not

                    // is it a pickable tile?
                    if (xIndex !== 0 && // not leftmost tile
                        xIndex !== theGame.specs.width - 1 && // not rightmost tile
                        ((xIndex - 1 +
                            yIndex * theGame.specs.width +
                            zIndex * theGame.specs.width * theGame.specs.height) in theGame.positionTileMatching && // both sides are occupied
                            (xIndex + 1 +
                                yIndex * theGame.specs.width +
                                zIndex * theGame.specs.width * theGame.specs.height) in theGame.positionTileMatching)) {
                        theGame.drawBoard();
                        return;
                    }

                    // picked the same tile?
                    if (theGame.selectedTilesIndex >= 0 && theGame.selectedTilesIndex === combined) {
                        theGame.drawBoard();
                        return;
                    }

                    //now we can porceed, YAY!
                    let thisTile = theGame.positionTileMatching[combined];
                    //console.log("SELECTED TILES INDEX : ", theGame.selectedTilesIndex);
                    if (theGame.selectedTilesIndex >= 0 &&
                        thisTile.equals(theGame.positionTileMatching[theGame.selectedTilesIndex])) {
                        console.log("WOOHOO!");
                        // WITH ANIMATION PERHAPS??
                        delete theGame.positionTileMatching[combined];
                        delete theGame.positionTileMatching[theGame.selectedTilesIndex];
                        theGame.selectedTilesIndex = -1;

                        if (Object.keys(theGame.positionTileMatching).length === 0) {
                            //GAME OVER, congrats;
                            alert("Welldone skilled player!");
                            theGame.reset();
                        }
                    } else {
                        theGame.positionTileMatching[combined].setFilter();
                        theGame.selectedTilesIndex = combined;
                    }
                    break;
                }

                theGame.handleResize();
                theGame.drawBoard();

            }, false);
            this.reset();

            this.tilesStartX = (this.canvas.width - this.specs.width * srcImgData.tileWidth * this.specs.scale) / 2;
            this.tilesStartY = (this.canvas.height - this.specs.height * srcImgData.tileHeight * this.specs.scale) / 2;

        }

        reset() {
            this.currentTileIndex = 0;
            this.currentTileCount = 0;
            this.positionTileMatching = {};
            this.possibleLocations = new PossibleLocs(this.specs);
            this.tiles = this.generateTiles();
            this.resize();

            for (let i = 0; i < this.numTiles; i++) {
                this.assignTile();
            }
            this.drawBoard();
        }

        generateTiles() {
            /*
            * We would like to select as many different tiles as possible,
            * but pairs of them. We know that there are 
            * srcImgData.numRows * srcImgData.numColumns different tile versions.
            */
            let maxIndex = srcImgData.numRows * srcImgData.numColumns;
            let mappings = {
                0: new Set(Array.from(Array(maxIndex)).map((e, i) => i)),
            };
            let result = [];

            while (result.length < this.numTiles / 2) {
                let countKey = Math.min(...Object.keys(mappings));
                let items = Array.from(mappings[countKey]);
                let selectedIndex = random(0, items.length - 1);
                mappings[countKey].delete(items[selectedIndex]);

                if (mappings[countKey].size === 0) {
                    delete mappings[countKey];
                }
                if (!((countKey + 1) in mappings)) {
                    mappings[countKey + 1] = new Set();
                }
                mappings[countKey + 1].add(items[selectedIndex]);

                let xIndex = items[selectedIndex] % srcImgData.numColumns;
                let yIndex = (items[selectedIndex] - xIndex) / srcImgData.numColumns;
                result.push(new Tile(xIndex, yIndex));
            }

            return result;
        }

        assignTile() {
            if (this.tiles.length == this.currentTileIndex) {
                console.log("All done, resetting");
                this.reset();
            }

            let tile = this.tiles[this.currentTileIndex];
            this.currentTileCount++;
            if (this.currentTileCount > 1) {
                this.currentTileCount = 0;
                this.currentTileIndex++;
            }

            let combined;
            if (this.currentTileCount === 1) {
                combined = this.possibleLocations.get();
                this.firstOfPairLoc = combined;
            }
            else {

                let tryCount = 5;
                let blocking = false;
                let prevPosX = this.firstOfPairLoc % this.specs.width;

                do {
                    combined = this.possibleLocations.get(this.firstOfPairLoc);
                    blocking = false;
                    /*
                    if ((combined + 1) == this.firstOfPairLoc) {
                        if (prevPosX + 1 < this.specs.width) {
                            if ((this.firstOfPairLoc + 1) in this.positionTileMatching) {
                                console.log("AHTUNG!! AHTUNG!!");
                                this.possibleLocations.release(combined);
                                blocking = true;
                            }
                        }
                    }

                    if ((combined - 1) == this.firstOfPairLoc) {
                        if (prevPosX - 1 >= 0) {
                            if ((this.firstOfPairLoc - 1) in this.positionTileMatching) {
                                console.log("AHTUNG2!! AHTUNG2!!");
                                this.possibleLocations.release(combined);
                                blocking = true;
                            }
                        }
                    }
                    */
                    tryCount--;
                    console.log("Try count : ", tryCount);

                } while (blocking && tryCount > 0);

                if (blocking) {
                    combined = this.possibleLocations.get();
                }
            }
            this.positionTileMatching[combined] = tile.clone();
        }

        drawBoard() {
            /*
            this.ctx.beginPath();
            this.ctx.lineWidth = "6";
            this.ctx.strokeStyle = "red";
            this.ctx.rect(
                0, 0, this.canvas.width, this.canvas.height
            );
            this.ctx.stroke();
            */

            for (let k = 0; k < this.specs.depth; k++) {
                for (let i = 0; i < this.specs.width; i++) {
                    for (let j = 0; j < this.specs.height; j++) {
                        let combined = i +
                            j * this.specs.width +
                            k * this.specs.width * this.specs.height;
                        //this.drawRect(i, j);
                        if (combined in this.positionTileMatching) {
                            this.drawTile(i, j, this.positionTileMatching[combined], k);
                        }
                    }
                }
            }
            /*
            let rightBottom = (this.specs.width - 1) + (this.specs.height - 1) * this.specs.width;
            if (rightBottom in this.positionTileMatching) {
                this.drawTile(this.specs.width - 1, this.specs.height - 1, this.positionTileMatching[rightBottom], srcImgData.zStep);
            }
            */

        }

        drawRect(posX, posY) {
            // Red rectangle
            /*
            this.ctx.beginPath();
            this.ctx.lineWidth = "6";
            this.ctx.strokeStyle = "red";
            */
            this.ctx.rect(
                (this.canvas.width - this.specs.width * srcImgData.tileWidth * this.specs.scale) / 2 +
                posX * srcImgData.tileWidth * this.specs.scale,
                (this.canvas.height - this.specs.height * srcImgData.tileHeight * this.specs.scale) / 2 +
                posY * srcImgData.tileHeight * this.specs.scale,
                srcImgData.tileWidth * this.specs.scale,
                srcImgData.tileHeight * this.specs.scale);

            this.ctx.stroke();
        }

        drawTile(posX, posY, tile, depthIndex = 0) {
            const rowIndex = tile.imgYIndex;
            const colIndex = tile.imgXIndex;

            this.ctx.filter = tile.filter;
            this.ctx.drawImage(this.heightener,
                srcImgData.heightenerX,
                srcImgData.heightenerY,
                srcImgData.heightenerWidth,
                srcImgData.heightenerHeight,
                (this.canvas.width - this.specs.width * srcImgData.tileWidth * this.specs.scale) / 2 +
                posX * srcImgData.tileWidth * this.specs.scale + srcImgData.heightenerX - depthIndex * srcImgData.zStep,
                (this.canvas.height - this.specs.height * srcImgData.tileHeight * this.specs.scale) / 2 +
                posY * srcImgData.tileHeight * this.specs.scale + srcImgData.heightenerY - depthIndex * srcImgData.zStep,
                srcImgData.heightenerWidth * this.specs.scale,
                srcImgData.heightenerHeight * this.specs.scale
            );
            this.ctx.drawImage(this.stripe,
                srcImgData.xStart + srcImgData.xStep * colIndex, // topleft pixel X position from srcImg
                srcImgData.yStart + srcImgData.yStep * rowIndex, // topleft pixel Y position from srcImg
                srcImgData.tileWidth, // src width of a tile
                srcImgData.tileHeight, // src height of a tile
                (this.canvas.width - this.specs.width * srcImgData.tileWidth * this.specs.scale) / 2 +
                posX * srcImgData.tileWidth * this.specs.scale - depthIndex * srcImgData.zStep,
                (this.canvas.height - this.specs.height * srcImgData.tileHeight * this.specs.scale) / 2 +
                posY * srcImgData.tileHeight * this.specs.scale - depthIndex * srcImgData.zStep,
                srcImgData.tileWidth * this.specs.scale,
                srcImgData.tileHeight * this.specs.scale
            );

        }

        handleResize = () => {
            let minDimension = window.innerWidth < window.innerHeight ?
                window.innerWidth : window.innerHeight;
            this.canvas.width = minDimension;
            this.canvas.height = minDimension;
        };

        resize() {
            this.handleResize();
            this.drawBoard();
        }
    };
    class Tile {
        constructor(imgXIndex, imgYIndex) {
            this.imgXIndex = imgXIndex;
            this.imgYIndex = imgYIndex;
            this.filter = 'none';
            this.dtid = imgXIndex + imgYIndex * srcImgData.numColumns;
        }
        equals(other) {
            return other.dtid === this.dtid;
        }
        setFilter() {
            this.filter = 'contrast(1.9)';
        }
        resetFilter() {
            this.filter = 'none';
        }

        clone() {
            return new Tile(this.imgXIndex, this.imgYIndex);
        }
    }

    class Row {
        constructor(specs) {
            this.specs = specs;
            this.start = -1;
            this.end = -1;
            this.startLimit = 0;
            this.endLimit = specs.width - 1;
        }

        updateAvailability(columnIndex) {
            if (this.startLimit > columnIndex) {
                this.startLimit = columnIndex;
            } else if (this.endLimit < columnIndex) {
                this.endLimit = columnIndex;
            }
        }

        getEmptyPosCount() {
            if (this.isFull()) {
                return 0;
            }
            if (this.isEmpty()) {
                return this.endLimit - this.startLimit + 1;
            } else {
                return (this.endLimit - this.end) +
                    (this.start - this.startLimit);
            }
        }

        getFilledLength() {
            if (this.isEmpty()) {
                return 0;
            } else if (this.isFull()) {
                return this.specs.width;
            } else {
                return this.end - this.start + 1;
            }
        }

        createRowAbove() {
            let result = new Row(this.specs);
            result.startLimit = this.start;
            result.endLimit = this.end;
            return result;
        }

        isEmpty() {
            return this.start === -1 && this.end === -1;
        }

        isFull() {
            return (this.start === this.startLimit) && (this.end === this.endLimit);
        }

        getAndUpdate(settings) {
            if (this.isEmpty()) {
                let result = random(this.startLimit, this.endLimit);
                this.start = result;
                this.end = result;
                return result;
            }
            if (this.isFull()) {
                return -1;
            }

            if (this.start === this.startLimit) {
                this.end++;
                return this.end;
            }
            if (this.end === this.endLimit) {
                this.start--;
                return this.start;
            }

            if (random(0, 1) === 0) {
                this.start--;
                if (settings.sameDepthAndRow && settings.prevColumnIndex === this.start) {
                    console.log("OLUYORMUS 1");
                    this.start++;
                    this.end++;
                    return this.end;
                }
                return this.start;
            } else {
                this.end++;
                if (settings.sameDepthAndRow && settings.prevColumnIndex == this.end) {
                    console.log("OLUYORMUS 2");
                    this.end--;
                    this.start--;
                    return this.start;
                }
                return this.end;
            }
        }
    }

    class Plane {
        constructor(specs, depthIndex, planeBelow) {
            this.specs = specs;
            this.availRows = {};
            this.depthIndex = depthIndex;
            if (depthIndex === 0) {
                for (let i = 0; i < specs.height; i++) {
                    this.availRows[i] = new Row(specs);
                }
            }
            else {
                for (let i = 0; i < specs.height; i++) {
                    let belowRow = planeBelow.getRow(i);
                    if (belowRow) {
                        if (belowRow.isEmpty()) {
                            continue;
                        } else {
                            this.availRows[i] = belowRow.createRowAbove();
                        }
                    }
                }
            }
        }



        getRow(rowIndex) {
            return this.availRows[rowIndex];
        }

        updateAvailability(rowIndex, columnIndex, planeBelow) {
            if (rowIndex in this.availRows) {
                this.availRows[rowIndex].updateAvailability(columnIndex);
            } else {
                let belowRow = planeBelow.getRow(rowIndex);
                if (belowRow) {
                    this.availRows[rowIndex] = belowRow.createRowAbove();
                } else {
                    this.availRows[rowIndex] = new Row(this.specs);
                }
            }
        }

        isFull() {
            for (let i = 0; i < this.specs.height; i++) {
                if (!(i in this.availRows)) {
                    continue;
                }
                if (!this.availRows[i].isFull()) {
                    return false;
                }
            }
            return true;
        }

        getEmptyPosCount() {
            let result = 0;
            for (let i = 0; i < this.specs.height; i++) {
                if (this.availRows[i]) {
                    result += this.availRows[i].getEmptyPosCount();
                }
            }
            return result;
        }

        get(aboveOfPrevious) {
            let aboveDim = new Dimension(aboveOfPrevious, this.specs);
            /*
                Find the rows with the max num of avail positions
                select those that are equal or one less and return from that row
             */
            let maxAvailPosCount = 0;
            for (let i = 0; i < this.specs.height; i++) {
                if (i in this.availRows) {
                    let rowEmptyCount = this.availRows[i].getEmptyPosCount();
                    if (maxAvailPosCount < rowEmptyCount) {
                        maxAvailPosCount = rowEmptyCount;
                    }
                }
            }

            let rows = Array.from(Object.keys(this.availRows));
            let maxEmptyPosRows = rows.filter(
                key => this.availRows[key].getEmptyPosCount() > 0 &&
                    this.availRows[key].getEmptyPosCount() >= maxAvailPosCount - 1
            );

            let arrayIndex = random(0, maxEmptyPosRows.length - 1);
            let rowIndex = maxEmptyPosRows[arrayIndex];
            let columnIndex;
            let columnSelectionSettings = {
                sameDepthAndRow: this.depthIndex == aboveDim.depthIndex && rowIndex == aboveDim.rowIndex,
                prevColumnIndex: aboveDim.columnIndex,
            };

            if (columnSelectionSettings.sameDepthAndRow && this.availRows[rowIndex].getEmptyPosCount() === 1) {
                console.log("HAYDA, we better select another row!");
                if (maxEmptyPosRows.length > 1) {
                    maxEmptyPosRows = maxEmptyPosRows.filter(key => key != rowIndex);
                    arrayIndex = random(0, maxEmptyPosRows.length - 1);
                    rowIndex = maxEmptyPosRows[arrayIndex];
                } else {
                    return -1;
                }
            }

            columnIndex = this.availRows[rowIndex].getAndUpdate(columnSelectionSettings);
            /*
            if (this.availRows[rowIndex].isFull()) {
                delete this.availRows[rowIndex];
            }
            */
            return columnIndex +
                rowIndex * this.specs.width +
                this.depthIndex * this.specs.width * this.specs.height;
        }
    }

    class PossibleLocs {
        constructor(specs) {
            this.specs = specs;
            this.planes = {
                0: new Plane(specs, 0),
            };
        }

        updatePlanes(combined) {
            let depthIndex = Math.floor(combined / (this.specs.width * this.specs.height));
            if (depthIndex + 1 >= this.specs.depth) {
                return;
            }
            combined -= this.specs.width * this.specs.height * depthIndex;
            let columnIndex = combined % this.specs.width;
            combined -= columnIndex;
            let rowIndex = combined / this.specs.width;
            // a position is picked at rowIndex, colIndex, depthIndex
            // the plane over this should be updated accordingly
            if (!((depthIndex + 1) in this.planes)) {
                this.planes[depthIndex + 1] = new Plane(this.specs, depthIndex + 1, this.planes[depthIndex]);
            } else {
                this.planes[depthIndex + 1].updateAvailability(rowIndex, columnIndex, this.planes[depthIndex]);
            }
        }

        get(firstOfThePairLoc) {
            let planeIndices = Object.keys(this.planes);
            /*
                Find the planes with the maxAvailable positions
                and pick those that have ( >= maxAvailable - 1)
            */
            let maxAvailableCount = 0;
            for (let i = 0; i < planeIndices.length; i++) {
                let depthIndex = planeIndices[i];
                let planesEmptyPosCount = this.planes[depthIndex].getEmptyPosCount();
                if (planesEmptyPosCount > maxAvailableCount) {
                    maxAvailableCount = planesEmptyPosCount;
                }
            }

            let possiblePlaneIndices = planeIndices.filter(
                key => this.planes[key].getEmptyPosCount() > 0 &&
                    this.planes[key].getEmptyPosCount() >= maxAvailableCount - 1
            );
            let arrayIndex = random(0, possiblePlaneIndices.length - 1);
            let depthIndex = possiblePlaneIndices[arrayIndex];

            let aboveOfPrevious = firstOfThePairLoc + this.specs.width * this.specs.height;
            let result = this.planes[depthIndex].get(aboveOfPrevious);
            if (result < 0) {
                /**
                 * THIS MEANS WE SHOULD PICK ANOTHER PLANE!!
                 */
                console.log("Trying to pick another plane");
                console.log("Previous plane was : ", depthIndex);
                if (possiblePlaneIndices.length > 1) {
                    possiblePlaneIndices = possiblePlaneIndices.filter(x => x != depthIndex);
                    arrayIndex = random(0, possiblePlaneIndices.length - 1);
                    depthIndex = possiblePlaneIndices[arrayIndex];
                    console.log("Current plane is : ", depthIndex);
                    result = this.planes[depthIndex].get(aboveOfPrevious);
                } else {
                    console.log("At this point we are hopeless!");
                }
            }
            this.updatePlanes(result);
            return result;
        }
        release(combined) {
            let depthIndex = combined % (this.specs.width * this.specs.height);
            combined -= depthIndex * this.specs.width * this.specs.height;
            let columnIndex = combined % this.specs.width;
            let rowIndex = (combined - columnIndex) / this.specs.width;

            console.log("RELESE NOT IMPLEMENTED PROPERLY YET!");
            /*
            if (!(depthIndex in this.avails)) {
                if (depthIndex > 0) {
                    this.avails[depthIndex] = new Plane(this.specs, depthIndex, this.planes[depthIndex - 1]);
                } else {
                    this.avails[depthIndex] = new Plane(this.specs, depthIndex);
                }
                let row = this.avails[depthIndex].getRow(rowIndex);
                if (columnIndex === 0) {
                    row.start = 1;
                    
                }
            }
            

            if (!(rowIndex in this.avails)) {
                this.avails[rowIndex] = new Row(this.specs);
                if (columnIndex == 0) {
                    this.avails[rowIndex].start = 1;
                    this.avails[rowIndex].end = this.specs.width - 1;
                } else {
                    this.avails[rowIndex].start = 0;
                    this.avails[rowIndex].end = columnIndex - 1;
                }
            }
            else if (this.avails[rowIndex].start === columnIndex) {
                this.avails[rowIndex].start++;
            } else {
                this.avails[rowIndex].end--;
            }
            */
        }
    }

    let game;

    return {
        init: (doc) => {
            game = new Game(doc, playAreaSpecs);
        },
        resize: (doc) => {
            game.resize();
        },
    };
}();