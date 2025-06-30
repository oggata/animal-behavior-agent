// 地形システム設定
const CHUNK_SIZE = 50;
const RENDER_DISTANCE = 300;
const NOISE_SCALE = 0.02;
const HEIGHT_SCALE = 20;
const LOD_DISTANCES = [75, 150, 225, 300];
const LOD_RESOLUTIONS = [64, 32, 16, 8];

// チャンク管理
const chunks = new Map();
const activeChunks = new Set();

// 決定論的乱数生成器（LCG - Linear Congruential Generator）
function deterministicRandom(seed) {
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    return ((a * seed + c) % m) / m;
}

// ハッシュ関数（座標からシードを生成）
function hash(x, y) {
    let h = Math.floor(x) * 374761393 + Math.floor(y) * 668265263;
    h = (h ^ (h >>> 13)) * 1274126177;
    h = h ^ (h >>> 16);
    return Math.abs(h);
}

// 補間関数（滑らかな補間）
function smoothstep(t) {
    return t * t * (3 - 2 * t);
}

// 線形補間
function lerp(a, b, t) {
    return a + (b - a) * t;
}

// 決定論的ノイズ関数（Perlin noise風）
function deterministicNoise(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;

    // 4つのコーナーのハッシュ値から疑似乱数を生成
    const a = deterministicRandom(hash(ix, iy));
    const b = deterministicRandom(hash(ix + 1, iy));
    const c = deterministicRandom(hash(ix, iy + 1));
    const d = deterministicRandom(hash(ix + 1, iy + 1));

    // 双線形補間
    const i1 = lerp(a, b, smoothstep(fx));
    const i2 = lerp(c, d, smoothstep(fx));
    return lerp(i1, i2, smoothstep(fy));
}

// フラクタルノイズ（マルチオクターブ）
function fractalNoise(x, y, octaves = 6) {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
        value += deterministicNoise(x * frequency, y * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2;
    }

    return value / maxValue;
}

// リッジノイズ（山脈用）
function ridgeNoise(x, y) {
    return 1 - Math.abs(deterministicNoise(x, y) * 2 - 1);
}

// メイン地形ノイズ関数
function noise(x, y) {
    const nx = x * NOISE_SCALE;
    const ny = y * NOISE_SCALE;
    
    // config.jsの設定を使用
    const config = terrainConfig.generation;
    
    // ベース地形（大きな起伏）- 設定に基づいて調整
    const baseNoise = fractalNoise(nx * config.baseNoiseScale, ny * config.baseNoiseScale, 4) * config.baseNoiseAmplitude;
    
    // 詳細ノイズ（小さな起伏）- 設定に基づいて調整
    const detailNoise = fractalNoise(nx * config.detailNoiseScale, ny * config.detailNoiseScale, 6) * config.detailNoiseAmplitude;
    
    // 山脈ノイズ - 設定に基づいて調整
    const mountainNoise = ridgeNoise(nx * config.mountainNoiseScale, ny * config.mountainNoiseScale) * config.mountainNoiseAmplitude;
    
    // 大陸形状（中央が高く、端が低い）- 設定に基づいて調整
    const continentShape = 1 - Math.min(1, Math.sqrt(x*x + y*y) * config.continentShapeScale);
    
    // 全て組み合わせ
    let rawHeight = (baseNoise + detailNoise + mountainNoise) * continentShape;
    
    // heightRangesの割合設定を反映するための高さ調整
    const terrainRanges = terrainConfig.heightRanges;
    
    // 正規化された高さ（0-1の範囲）
    const normalizedHeight = (rawHeight + 10) / 20; // -10から10の範囲を0-1に正規化
    const clampedHeight = Math.max(0, Math.min(1, normalizedHeight));
    
    // 地形タイプを決定（割合に基づいて）
    let selectedTerrain = null;
    let cumulativeRatio = 0;
    
    for (const [terrainType, range] of Object.entries(terrainRanges)) {
        cumulativeRatio += range.ratio;
        if (clampedHeight <= cumulativeRatio) {
            selectedTerrain = { type: terrainType, range: range };
            break;
        }
    }
    
    // デフォルトは低地草原
    if (!selectedTerrain) {
        selectedTerrain = { type: "低地草原", range: terrainRanges["低地草原"] };
    }
    
    // 選択された地形の範囲内でランダムな高さを生成
    const terrainRange = selectedTerrain.range;
    const localNoise = fractalNoise(nx * 2, ny * 2, 3) * 0.5 + 0.5; // 0-1の範囲
    const adjustedHeight = terrainRange.min + (terrainRange.max - terrainRange.min) * localNoise;
    
    // 調整された高さを返す
    return adjustedHeight * HEIGHT_SCALE * 0.2;
}

// チャンククラス
class TerrainChunk {
    constructor(chunkX, chunkZ) {
        this.chunkX = chunkX;
        this.chunkZ = chunkZ;
        this.worldX = chunkX * CHUNK_SIZE;
        this.worldZ = chunkZ * CHUNK_SIZE;
        this.mesh = null;
        this.currentLOD = -1;
        this.geometries = {}; // 各LODレベルのジオメトリを保存
    }

    generateGeometry(lodLevel) {
        if (this.geometries[lodLevel]) {
            return this.geometries[lodLevel];
        }

        const resolution = LOD_RESOLUTIONS[lodLevel];
        const geometry = new THREE.PlaneGeometry(
            CHUNK_SIZE, 
            CHUNK_SIZE, 
            resolution - 1, 
            resolution - 1
        );

        const vertices = geometry.attributes.position.array;
        const colors = [];

        // 平面を水平に回転（Y-up座標系）
        geometry.rotateX(-Math.PI / 2);

        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i] + this.worldX;
            const z = vertices[i + 2] + this.worldZ;
            const height = noise(x, z);
            
            vertices[i + 1] = height; // Y座標（高さ）を設定

            // 高度に応じた色設定（config.jsの設定を使用）
            let r, g, b;
            
            // config.jsの地形設定を使用
            const terrainRanges = terrainConfig.heightRanges;
            const terrainColors = terrainConfig.colors;
            
            let terrainType = "低地草原"; // デフォルト
            for (const [type, range] of Object.entries(terrainRanges)) {
                if (height >= range.min && height < range.max) {
                    terrainType = type;
                    break;
                }
            }
            
            const color = terrainColors[terrainType];
            r = color.r; g = color.g; b = color.b;
            
            colors.push(r, g, b);
        }

        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.computeVertexNormals();

        this.geometries[lodLevel] = geometry;
        return geometry;
    }

    update(playerPos) {
        const distance = Math.sqrt(
            Math.pow(playerPos.x - (this.worldX + CHUNK_SIZE/2), 2) +
            Math.pow(playerPos.z - (this.worldZ + CHUNK_SIZE/2), 2)
        );

        // LODレベル決定
        let newLOD = LOD_DISTANCES.length - 1;
        for (let i = 0; i < LOD_DISTANCES.length; i++) {
            if (distance < LOD_DISTANCES[i]) {
                newLOD = i;
                break;
            }
        }

        // LODが変更された場合のみメッシュを更新
        if (newLOD !== this.currentLOD) {
            this.currentLOD = newLOD;
            
            if (this.mesh) {
                scene.remove(this.mesh);
                this.mesh.geometry.dispose();
            }

            const geometry = this.generateGeometry(newLOD);
            const material = new THREE.MeshLambertMaterial({
                vertexColors: true,
                wireframe: false
            });

            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.set(
                this.worldX + CHUNK_SIZE/2,
                0,
                this.worldZ + CHUNK_SIZE/2
            );
            this.mesh.receiveShadow = true;
            scene.add(this.mesh);
        }
    }

    dispose() {
        if (this.mesh) {
            scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        
        // 全てのLODジオメトリを破棄
        Object.values(this.geometries).forEach(geometry => {
            geometry.dispose();
        });
        this.geometries = {};
    }
}

// チャンク管理システム
function updateChunks() {
    const playerChunkX = Math.floor(camera.position.x / CHUNK_SIZE);
    const playerChunkZ = Math.floor(camera.position.z / CHUNK_SIZE);
    const renderChunks = Math.ceil(RENDER_DISTANCE / CHUNK_SIZE);

    const newActiveChunks = new Set();

    // 必要なチャンクを特定
    for (let dx = -renderChunks; dx <= renderChunks; dx++) {
        for (let dz = -renderChunks; dz <= renderChunks; dz++) {
            const chunkX = playerChunkX + dx;
            const chunkZ = playerChunkZ + dz;
            
            const distance = Math.sqrt(dx*dx + dz*dz) * CHUNK_SIZE;
            if (distance <= RENDER_DISTANCE) {
                const key = `${chunkX},${chunkZ}`;
                newActiveChunks.add(key);

                // 新しいチャンクを作成
                if (!chunks.has(key)) {
                    chunks.set(key, new TerrainChunk(chunkX, chunkZ));
                }
            }
        }
    }

    // 不要なチャンクを削除
    const chunksToRemove = [];
    chunks.forEach((chunk, key) => {
        if (!newActiveChunks.has(key)) {
            chunk.dispose();
            chunksToRemove.push(key);
        }
    });
    chunksToRemove.forEach(key => chunks.delete(key));

    // アクティブなチャンクを更新
    newActiveChunks.forEach(key => {
        const chunk = chunks.get(key);
        chunk.update(camera.position);
    });

    activeChunks.clear();
    newActiveChunks.forEach(key => activeChunks.add(key));
}

// 地形の高さを取得する関数（動物の移動に使用）
function getTerrainHeight(x, z) {
    return noise(x, z);
}

// 地形の分布を確認するためのデバッグ関数
function analyzeTerrainDistribution() {
    console.log("=== 地形分布分析 ===");
    
    const terrainRanges = terrainConfig.heightRanges;
    const totalRatio = Object.values(terrainRanges).reduce((sum, range) => sum + range.ratio, 0);
    
    console.log("設定された割合:");
    Object.entries(terrainRanges).forEach(([type, range]) => {
        const percentage = (range.ratio / totalRatio * 100).toFixed(1);
        console.log(`${type}: ${percentage}% (高さ: ${range.min}-${range.max})`);
    });
    
    // 実際の地形分布をサンプリング
    const sampleSize = 1000;
    const terrainCounts = {};
    
    for (let i = 0; i < sampleSize; i++) {
        const x = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        const height = noise(x, z);
        
        // 高さから地形タイプを決定
        let terrainType = "低地草原"; // デフォルト
        for (const [type, range] of Object.entries(terrainRanges)) {
            if (height >= range.min && height < range.max) {
                terrainType = type;
                break;
            }
        }
        
        terrainCounts[terrainType] = (terrainCounts[terrainType] || 0) + 1;
    }
    
    console.log("\n実際の分布（サンプリング結果）:");
    Object.entries(terrainCounts).forEach(([type, count]) => {
        const percentage = (count / sampleSize * 100).toFixed(1);
        console.log(`${type}: ${percentage}% (${count}個)`);
    });
}

// 地形システムの初期化
function initTerrain() {
    console.log("地形システム初期化中...");
    
    // 地形分布を分析
    analyzeTerrainDistribution();
    
    // 初期チャンクを強制生成
    updateChunks();
    console.log("初期チャンク生成完了:", chunks.size, "個");
}

// 地形システムの更新
function updateTerrain() {
    updateChunks();
}

// 地形システムのクリーンアップ
function disposeTerrain() {
    chunks.forEach(chunk => {
        chunk.dispose();
    });
    chunks.clear();
    activeChunks.clear();
} 