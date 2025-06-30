// サバンナの地形配置を管理するクラス
class CityLayout {
    constructor() {
        this.roads = [];
        this.buildings = [];
        this.intersections = [];
        this.gridSize = 150;
        this.roadWidth = 2;
        this.buildingSize = 4;
        this.minBuildingDistance = 6;
        this.blockSize = 10; // 街区のサイズ
        this.shortRoadRatio = 0.4; // 短い道路を生やす割合（0.0〜1.0）
        
        // 地形サイズの定義
        this.buildingSizes = {
            large: this.buildingSize * 2,    // 大：草原、池など
            medium: this.buildingSize,       // 中：木、大きな石など
            small: this.buildingSize * 0.5   // 小：洞穴、倒木など
        };
    }

    // 地形の生成
    generateRoads() {
        // メインストリート（大通り）
        const mainStreets = this.generateMainStreets();
        
        // サブストリート（小道）
        const subStreets = this.generateSubStreets(mainStreets);
        
        this.roads = [...mainStreets, ...subStreets];
        this.findIntersections();
        // 短い道路を追加
        this.addShortRoads();
        
        // 地形を生成
        this.generateBuildings();
        
        // 施設を生成
        this.facilities = this.generateFacilities();
    }

    // メインストリートの生成
    generateMainStreets() {
        const mainStreets = [];
        const numMainStreets = 3; // メインストリートの本数
        const spacing = this.gridSize / (numMainStreets + 1);

        // 東西方向のメインストリート
        for (let i = 1; i <= numMainStreets; i++) {
            const z = -this.gridSize/2 + spacing * i;
            mainStreets.push({
                start: { x: -this.gridSize/2, z: z },
                end: { x: this.gridSize/2, z: z },
                type: 'main',
                isMain: Math.random() < 0.2 // 20%の確率で主要道路
            });
        }

        // 南北方向のメインストリート
        for (let i = 1; i <= numMainStreets; i++) {
            const x = -this.gridSize/2 + spacing * i;
            mainStreets.push({
                start: { x: x, z: -this.gridSize/2 },
                end: { x: x, z: this.gridSize/2 },
                type: 'main',
                isMain: Math.random() < 0.2
            });
        }

        return mainStreets;
    }

    // サブストリートの生成
    generateSubStreets(mainStreets) {
        const subStreets = [];
        const blockSize = this.blockSize;

        // メインストリートで区切られた各ブロック内にサブストリートを生成
        for (let i = 0; i < mainStreets.length; i++) {
            for (let j = i + 1; j < mainStreets.length; j++) {
                const street1 = mainStreets[i];
                const street2 = mainStreets[j];

                // 同じ方向の道路はスキップ
                if (this.isParallel(street1, street2)) continue;

                // 交差点を計算
                const intersection = this.findRoadIntersection(street1, street2);
                if (!intersection) continue;

                // ブロックの範囲を計算
                const blockBounds = this.calculateBlockBounds(street1, street2, intersection, mainStreets);
                if (!blockBounds) continue;

                // ブロック内にサブストリートを生成
                const blockSubStreets = this.generateBlockSubStreets(blockBounds);
                // サブストリートも20%で主要道路に
                blockSubStreets.forEach(street => {
                    street.isMain = Math.random() < 0.2;
                });
                subStreets.push(...blockSubStreets);
            }
        }

        return subStreets;
    }

    // 2つの道路が平行かどうかを判定
    isParallel(road1, road2) {
        const dx1 = road1.end.x - road1.start.x;
        const dz1 = road1.end.z - road1.start.z;
        const dx2 = road2.end.x - road2.start.x;
        const dz2 = road2.end.z - road2.start.z;

        // 方向ベクトルの外積が0なら平行
        return Math.abs(dx1 * dz2 - dx2 * dz1) < 0.001;
    }

    // ブロックの境界を計算
    calculateBlockBounds(street1, street2, intersection, mainStreets) {
        // 交差点から最も近い他のメインストリートとの交点を探す
        const otherIntersections = [];
        
        for (const street of mainStreets) {
            if (street === street1 || street === street2) continue;
            const otherIntersection = this.findRoadIntersection(street1, street);
            if (otherIntersection) otherIntersections.push(otherIntersection);
        }

        if (otherIntersections.length < 2) return null;

        // 最も近い2つの交点を選択
        otherIntersections.sort((a, b) => {
            const distA = Math.hypot(a.x - intersection.x, a.z - intersection.z);
            const distB = Math.hypot(b.x - intersection.x, b.z - intersection.z);
            return distA - distB;
        });

        return {
            minX: Math.min(intersection.x, otherIntersections[0].x),
            maxX: Math.max(intersection.x, otherIntersections[0].x),
            minZ: Math.min(intersection.z, otherIntersections[0].z),
            maxZ: Math.max(intersection.z, otherIntersections[0].z)
        };
    }

    // ブロック内のサブストリートを生成
    generateBlockSubStreets(blockBounds) {
        const subStreets = [];
        const { minX, maxX, minZ, maxZ } = blockBounds;
        const blockWidth = maxX - minX;
        const blockDepth = maxZ - minZ;

        // ブロックが十分な大きさの場合のみサブストリートを生成
        if (blockWidth > this.blockSize && blockDepth > this.blockSize) {
            // 東西方向のサブストリート
            const numEastWest = Math.floor(blockDepth / this.blockSize);
            for (let i = 1; i < numEastWest; i++) {
                const z = minZ + (blockDepth * i / numEastWest);
                subStreets.push({
                    start: { x: minX, z: z },
                    end: { x: maxX, z: z },
                    type: 'sub'
                });
            }

            // 南北方向のサブストリート
            const numNorthSouth = Math.floor(blockWidth / this.blockSize);
            for (let i = 1; i < numNorthSouth; i++) {
                const x = minX + (blockWidth * i / numNorthSouth);
                subStreets.push({
                    start: { x: x, z: minZ },
                    end: { x: x, z: maxZ },
                    type: 'sub'
                });
            }
        }

        return subStreets;
    }

    // 交差点の検出
    findIntersections() {
        this.intersections = [];
        for (let i = 0; i < this.roads.length; i++) {
            for (let j = i + 1; j < this.roads.length; j++) {
                const intersection = this.findRoadIntersection(this.roads[i], this.roads[j]);
                if (intersection) {
                    this.intersections.push(intersection);
                }
            }
        }
    }

    // 2つの道路の交差点を計算
    findRoadIntersection(road1, road2) {
        const x1 = road1.start.x;
        const y1 = road1.start.z;
        const x2 = road1.end.x;
        const y2 = road1.end.z;
        const x3 = road2.start.x;
        const y3 = road2.start.z;
        const x4 = road2.end.x;
        const y4 = road2.end.z;

        const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(denominator) < 0.001) return null; // 平行

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x: x1 + t * (x2 - x1),
                z: y1 + t * (y2 - y1)
            };
        }

        return null;
    }

    // 道路の点を取得
    getRoadPoints(road) {
        const points = [];
        const steps = 10;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            points.push({
                x: road.start.x + t * (road.end.x - road.start.x),
                z: road.start.z + t * (road.end.z - road.start.z)
            });
        }
        return points;
    }

    // 地形の位置が有効かチェック
    isValidBuildingPosition(x, z) {
        // 道路からの最小距離をチェック
        for (const road of this.roads) {
            if (this.pointToLineDistance(x, z, road) < this.minBuildingDistance) {
                return false;
            }
        }
        return true;
    }

    // 点から線までの距離を計算
    pointToLineDistance(x, z, road) {
        const A = x - road.start.x;
        const B = z - road.start.z;
        const C = road.end.x - road.start.x;
        const D = road.end.z - road.start.z;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, zz;

        if (param < 0) {
            xx = road.start.x;
            zz = road.start.z;
        } else if (param > 1) {
            xx = road.end.x;
            zz = road.end.z;
        } else {
            xx = road.start.x + param * C;
            zz = road.start.z + param * D;
        }

        const dx = x - xx;
        const dz = z - zz;
        return Math.sqrt(dx * dx + dz * dz);
    }

    // 最も近い道路の点を見つける
    findNearestRoadPoint(x, z) {
        let nearestPoint = null;
        let minDistance = Infinity;

        for (const road of this.roads) {
            const points = this.getRoadPoints(road);
            for (const point of points) {
                const distance = Math.hypot(x - point.x, z - point.z);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestPoint = point;
                }
            }
        }

        return nearestPoint;
    }

    // 経路探索
    findPath(start, end) {
        const startPoint = this.findNearestRoadPoint(start.x, start.z);
        const endPoint = this.findNearestRoadPoint(end.x, end.z);
        
        if (!startPoint || !endPoint) {
            return [start, end]; // 直接移動
        }
        
        return this.aStarPathfinding(startPoint, endPoint);
    }

    // A*経路探索アルゴリズム
    aStarPathfinding(start, end) {
        const openSet = [start];
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        gScore.set(this.pointToString(start), 0);
        fScore.set(this.pointToString(start), this.heuristic(start, end));

        while (openSet.length > 0) {
            // fScoreが最小のノードを選択
            let current = openSet[0];
            let currentIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                const currentFScore = fScore.get(this.pointToString(openSet[i])) || Infinity;
                const bestFScore = fScore.get(this.pointToString(current)) || Infinity;
                if (currentFScore < bestFScore) {
                    current = openSet[i];
                    currentIndex = i;
                }
            }

            if (this.pointDistance(current, end) < 1) {
                return this.reconstructPath(cameFrom, current);
            }

            openSet.splice(currentIndex, 1);
            closedSet.add(this.pointToString(current));

            const neighbors = this.getRoadNeighbors(current);
            for (const neighbor of neighbors) {
                if (closedSet.has(this.pointToString(neighbor))) {
                    continue;
                }

                const tentativeGScore = (gScore.get(this.pointToString(current)) || Infinity) + 
                                       this.pointDistance(current, neighbor);

                if (!openSet.some(p => this.pointDistance(p, neighbor) < 0.1)) {
                    openSet.push(neighbor);
                } else if (tentativeGScore >= (gScore.get(this.pointToString(neighbor)) || Infinity)) {
                    continue;
                }

                cameFrom.set(this.pointToString(neighbor), current);
                gScore.set(this.pointToString(neighbor), tentativeGScore);
                fScore.set(this.pointToString(neighbor), tentativeGScore + this.heuristic(neighbor, end));
            }
        }

        return [start, end]; // 経路が見つからない場合
    }

    // 道路の隣接点を取得
    getRoadNeighbors(point) {
        const neighbors = [];
        const searchRadius = 5;

        for (const road of this.roads) {
            const points = this.getRoadPoints(road);
            for (const roadPoint of points) {
                const distance = this.pointDistance(point, roadPoint);
                if (distance > 0.1 && distance < searchRadius) {
                    neighbors.push(roadPoint);
                }
            }
        }

        return neighbors;
    }

    // ヒューリスティック関数（直線距離）
    heuristic(point1, point2) {
        return this.pointDistance(point1, point2);
    }

    // 2点間の距離
    pointDistance(point1, point2) {
        return Math.hypot(point1.x - point2.x, point1.z - point2.z);
    }

    // 点を文字列に変換
    pointToString(point) {
        return `${point.x},${point.z}`;
    }

    // 経路を再構築
    reconstructPath(cameFrom, current) {
        const path = [current];
        while (cameFrom.has(this.pointToString(current))) {
            current = cameFrom.get(this.pointToString(current));
            path.unshift(current);
        }
        return path;
    }

    // 中間点を見つける
    findIntermediatePoint(start, end) {
        const midX = (start.x + end.x) / 2;
        const midZ = (start.z + end.z) / 2;
        
        // 最も近い道路の点を見つける
        const nearestPoint = this.findNearestRoadPoint(midX, midZ);
        if (nearestPoint) {
            return nearestPoint;
        }
        
        return { x: midX, z: midZ };
    }

    // 2つの点が同じ道路上にあるかチェック
    arePointsOnSameRoad(point1, point2) {
        for (const road of this.roads) {
            const roadPoints = this.getRoadPoints(road);
            let point1OnRoad = false;
            let point2OnRoad = false;
            
            for (const roadPoint of roadPoints) {
                if (this.pointDistance(point1, roadPoint) < 1) point1OnRoad = true;
                if (this.pointDistance(point2, roadPoint) < 1) point2OnRoad = true;
            }
            
            if (point1OnRoad && point2OnRoad) return true;
        }
        return false;
    }

    // 短い道路を追加
    addShortRoads() {
        const shortRoads = [];
        const numShortRoads = Math.floor(this.roads.length * this.shortRoadRatio);

        for (let i = 0; i < numShortRoads; i++) {
            const road1 = this.roads[Math.floor(Math.random() * this.roads.length)];
            const road2 = this.roads[Math.floor(Math.random() * this.roads.length)];
            
            if (road1 === road2) continue;

            const intersection1 = this.findRoadIntersection(road1, road2);
            if (!intersection1) continue;

            // 別の道路との交点を探す
            for (const road3 of this.roads) {
                if (road3 === road1 || road3 === road2) continue;
                
                const intersection2 = this.findRoadIntersection(road1, road3);
                if (!intersection2) continue;

                const distance = Math.hypot(intersection1.x - intersection2.x, intersection1.z - intersection2.z);
                if (distance > 5 && distance < 20) {
                    shortRoads.push({
                        start: intersection1,
                        end: intersection2,
                        type: 'short'
                    });
                    break;
                }
            }
        }

        this.roads.push(...shortRoads);
    }

    // 道路の描画
    drawRoads() {
        this.roads.forEach(road => {
            const roadGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(road.start.x, 0.01, road.start.z),
                new THREE.Vector3(road.end.x, 0.01, road.end.z)
            ]);
            
            const roadMaterial = new THREE.LineBasicMaterial({ 
                color: road.isMain ? 0x666666 : 0x999999,
                linewidth: road.isMain ? 3 : 1
            });
            
            const roadLine = new THREE.Line(roadGeometry, roadMaterial);
            scene.add(roadLine);
        });
    }

    // 地形の生成
    generateBuildings() {
        this.buildings = [];
        const numBuildings = 15; // 地形の数

        for (let i = 0; i < numBuildings; i++) {
            let attempts = 0;
            let x, z, buildingType, buildingSize;

            do {
                x = (Math.random() - 0.5) * this.gridSize * 0.8;
                z = (Math.random() - 0.5) * this.gridSize * 0.8;
                buildingType = this.getRandomTerrainType();
                buildingSize = this.getBuildingSizeByType(buildingType);
                attempts++;
            } while (!this.isBuildingOverlapping(x, z, buildingSize) && attempts < 100);

            if (attempts < 100) {
                this.buildings.push({
                    x: x,
                    z: z,
                    type: buildingType,
                    size: buildingSize,
                    color: this.getBuildingColorByType(buildingType)
                });
            }
        }
    }

    // 地形の重複チェック
    isBuildingOverlapping(x, z, buildingSize) {
        for (const building of this.buildings) {
            const distance = Math.hypot(x - building.x, z - building.z);
            const minDistance = (buildingSize + building.size) / 2 + this.minBuildingDistance;
            if (distance < minDistance) {
                return false;
            }
        }
        return true;
    }

    // ランダムな地形タイプを取得
    getRandomTerrainType() {
        const terrainTypes = ['草原', '木', '池', '洞穴', '倒木', '大きな石'];
        const weights = [0.3, 0.2, 0.15, 0.1, 0.15, 0.1]; // 確率の重み
        
        const random = Math.random();
        let cumulativeWeight = 0;
        
        for (let i = 0; i < terrainTypes.length; i++) {
            cumulativeWeight += weights[i];
            if (random <= cumulativeWeight) {
                return terrainTypes[i];
            }
        }
        
        return terrainTypes[0];
    }

    // 地形タイプに応じたサイズを取得
    getBuildingSizeByType(buildingType) {
        switch (buildingType) {
            case '草原':
            case '池':
                return this.buildingSizes.large;
            case '木':
            case '大きな石':
                return this.buildingSizes.medium;
            case '洞穴':
            case '倒木':
                return this.buildingSizes.small;
            default:
                return this.buildingSizes.medium;
        }
    }

    // 地形タイプに応じた色を取得
    getBuildingColorByType(buildingType) {
        switch (buildingType) {
            case '草原':
                return 0x90EE90;
            case '木':
                return 0x228B22;
            case '池':
                return 0x4169E1;
            case '洞穴':
                return 0x2F4F4F;
            case '倒木':
                return 0x8B4513;
            case '大きな石':
                return 0x708090;
            default:
                return 0x808080;
        }
    }

    // 地形の描画
    drawBuildings() {
        this.buildings.forEach(building => {
            // 地形の描画はbuildings.jsで行われるため、ここでは何もしない
        });
    }

    // 施設の生成（動物の自宅など）
    generateFacilities() {
        const facilities = [];
        
        // 動物の自宅を施設として追加
        animalPersonalities.forEach(animal => {
            // homeオブジェクトが存在しない場合はスキップ
            if (!animal.home) {
                return;
            }
            
            facilities.push({
                name: animal.home.name,
                x: animal.home.x,
                z: animal.home.z,
                type: 'home',
                color: animal.home.color
            });
        });
        
        return facilities;
    }

    // 施設の重複チェック
    isFacilityOverlapping(x, z, facilities) {
        for (const facility of facilities) {
            const distance = Math.hypot(x - facility.x, z - facility.z);
            if (distance < this.minBuildingDistance) {
                return true;
            }
        }
        return false;
    }

    // 施設の描画
    drawFacilities() {
        this.facilities.forEach(facility => {
            // 施設の描画はbuildings.jsで行われるため、ここでは何もしない
        });
    }

    // 経路の視覚化
    visualizePath(path, color = 0x00ff00) {
        // 既存の経路表示をクリア
        this.clearPathVisualization();
        
        // 新しい経路を描画
        for (let i = 0; i < path.length - 1; i++) {
            const start = path[i];
            const end = path[i + 1];
            
            const pathGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(start.x, 0.1, start.z),
                new THREE.Vector3(end.x, 0.1, end.z)
            ]);
            
            const pathMaterial = new THREE.LineBasicMaterial({ 
                color: color,
                linewidth: 3
            });
            
            const pathLine = new THREE.Line(pathGeometry, pathMaterial);
            scene.add(pathLine);
            
            // 経路オブジェクトを保存（後でクリアするため）
            if (!this.pathVisualizations) {
                this.pathVisualizations = [];
            }
            this.pathVisualizations.push(pathLine);
        }
    }

    // 経路表示のクリア
    clearPathVisualization() {
        if (this.pathVisualizations) {
            this.pathVisualizations.forEach(pathLine => {
                scene.remove(pathLine);
            });
            this.pathVisualizations = [];
        }
    }

    // 道路ネットワークの視覚化
    visualizeRoadNetwork() {
        this.roads.forEach(road => {
            const roadGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(road.start.x, 0.05, road.start.z),
                new THREE.Vector3(road.end.x, 0.05, road.end.z)
            ]);
            
            const roadMaterial = new THREE.LineBasicMaterial({ 
                color: road.isMain ? 0xff0000 : 0x00ff00,
                linewidth: road.isMain ? 5 : 2
            });
            
            const roadLine = new THREE.Line(roadGeometry, roadMaterial);
            scene.add(roadLine);
            
            // 道路オブジェクトを保存
            if (!this.roadVisualizations) {
                this.roadVisualizations = [];
            }
            this.roadVisualizations.push(roadLine);
        });
    }

    // 道路ネットワーク表示のクリア
    clearRoadNetworkVisualization() {
        if (this.roadVisualizations) {
            this.roadVisualizations.forEach(roadLine => {
                scene.remove(roadLine);
            });
            this.roadVisualizations = [];
        }
    }

    // 地形の入り口を取得
    getBuildingEntrance(building) {
        // 地形の場合は中心点を返す
        return {
            x: building.x,
            z: building.z
        };
    }

    // 地形の中心を取得
    getBuildingCenter(building) {
        return {
            x: building.x,
            z: building.z
        };
    }

    // 地形への経路を探索
    findPathToBuilding(start, building) {
        const buildingCenter = this.getBuildingCenter(building);
        return this.findPath(start, buildingCenter);
    }
}

// グローバル変数に追加
let cityLayout;