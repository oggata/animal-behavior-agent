// サバンナの地形の作成
function createLocations() {
    // 動的に生成された地形データを使用
    let dynamicLocationData = [];
    
    // cityLayout.facilitiesが空の場合はデフォルト地形を作成
    if (cityLayout.facilities && cityLayout.facilities.length > 0) {
        dynamicLocationData = cityLayout.facilities.map(facility => {
            // 地形タイプに応じてアクティビティと雰囲気を設定
            const terrainInfo = getTerrainInfo(facility.name);
            return {
                name: facility.name,
                x: facility.x,
                z: facility.z,
                color: terrainInfo.color,
                activities: terrainInfo.activities,
                atmosphere: terrainInfo.atmosphere
            };
        });
    } else {
        // デフォルト地形を作成
        const defaultTerrainTypes = [
            { name: "川", x: -10, z: -10 },
            { name: "草原", x: -20, z: -20 },
            { name: "池", x: 20, z: -15 },
            { name: "木", x: -15, z: 20 },
            { name: "洞穴", x: 25, z: 25 },
            { name: "大きな石", x: -25, z: 0 },
            { name: "倒木", x: 0, z: -25 }
        ];
        
        dynamicLocationData = defaultTerrainTypes.map(terrain => {
            const terrainInfo = getTerrainInfo(terrain.name);
            return {
                name: terrain.name,
                x: terrain.x,
                z: terrain.z,
                color: terrainInfo.color,
                activities: terrainInfo.activities,
                atmosphere: terrainInfo.atmosphere
            };
        });
        
        addLog('🌍 デフォルト地形を作成しました', 'system');
    }
    
    /*
    dynamicLocationData.forEach(loc => {
        const locationGroup = new THREE.Group();
        
        // 地形タイプに応じたサイズを取得
        const terrainSize = getTerrainSize(loc.name);
        const terrainHeight = terrainSize * 0.6; // 高さは幅の60%
        
        // 地形の高さを取得
        const groundHeight = getTerrainHeight(loc.x, loc.z);
        
        if(loc.name == "草原"){
            // 草原は特殊な形状（広大な平面）
            const grasslandGeometry = new THREE.CircleGeometry(terrainSize * 1.2, 32);
            const grasslandEdges = new THREE.EdgesGeometry(grasslandGeometry);
            const grassland = new THREE.LineSegments(grasslandEdges, new THREE.LineBasicMaterial({ color: 0x90EE90 }));
            grassland.rotation.x = -Math.PI / 2;
            grassland.position.set(0, groundHeight + 0.01, 0);
            locationGroup.add(grassland);
        } else if(loc.name == "池"){
            // 池は特殊な形状（円形の水面）
            const pondGeometry = new THREE.CircleGeometry(terrainSize * 0.8, 32);
            const pondEdges = new THREE.EdgesGeometry(pondGeometry);
            const pond = new THREE.LineSegments(pondEdges, new THREE.LineBasicMaterial({ color: 0x4169E1 }));
            pond.rotation.x = -Math.PI / 2;
            pond.position.set(0, groundHeight + 0.01, 0);
            locationGroup.add(pond);
        } else if(loc.name == "川"){
            // 川は特殊な形状（細長い流れ）
            const riverGeometry = new THREE.PlaneGeometry(terrainSize * 0.3, terrainSize * 2, 8, 16);
            const riverEdges = new THREE.EdgesGeometry(riverGeometry);
            const river = new THREE.LineSegments(riverEdges, new THREE.LineBasicMaterial({ color: 0x4169E1 }));
            river.rotation.x = -Math.PI / 2;
            river.position.set(0, groundHeight + 0.01, 0);
            locationGroup.add(river);
        } else if(loc.name == "木"){
            // 木の基本構造
            const trunkGeometry = new THREE.CylinderGeometry(terrainSize * 0.2, terrainSize * 0.3, terrainHeight * 2, 8);
            const trunkEdges = new THREE.EdgesGeometry(trunkGeometry);
            const trunkMaterial = new THREE.LineBasicMaterial({ color: 0x8B4513 });
            const trunk = new THREE.LineSegments(trunkEdges, trunkMaterial);
            trunk.position.set(0, groundHeight + terrainHeight, 0);
            locationGroup.add(trunk);

            // 木の葉
            const leavesGeometry = new THREE.SphereGeometry(terrainSize * 0.8, 8, 8);
            const leavesEdges = new THREE.EdgesGeometry(leavesGeometry);
            const leavesMaterial = new THREE.LineBasicMaterial({ color: 0x228B22 });
            const leaves = new THREE.LineSegments(leavesEdges, leavesMaterial);
            leaves.position.set(0, groundHeight + terrainHeight * 2.5, 0);
            locationGroup.add(leaves);
        } else if(loc.name == "倒木"){
            // 倒木の基本構造（横倒しの円柱）
            const fallenLogGeometry = new THREE.CylinderGeometry(terrainSize * 0.3, terrainSize * 0.3, terrainSize * 2, 8);
            const fallenLogEdges = new THREE.EdgesGeometry(fallenLogGeometry);
            const fallenLogMaterial = new THREE.LineBasicMaterial({ color: 0x8B4513 });
            const fallenLog = new THREE.LineSegments(fallenLogEdges, fallenLogMaterial);
            fallenLog.rotation.z = Math.PI / 2;
            fallenLog.position.set(0, groundHeight + terrainSize * 0.3, 0);
            locationGroup.add(fallenLog);
        } else if(loc.name == "大きな石"){
            // 大きな石の基本構造（不規則な形状）
            const rockGeometry = new THREE.DodecahedronGeometry(terrainSize * 0.6);
            const rockEdges = new THREE.EdgesGeometry(rockGeometry);
            const rockMaterial = new THREE.LineBasicMaterial({ color: 0x708090 });
            const rock = new THREE.LineSegments(rockEdges, rockMaterial);
            rock.position.set(0, groundHeight + terrainSize * 0.6, 0);
            locationGroup.add(rock);
        } else {
            // 洞穴の基本構造
            const caveGeometry = new THREE.SphereGeometry(terrainSize * 0.8, 8, 8);
            const caveEdges = new THREE.EdgesGeometry(caveGeometry);
            const caveMaterial = new THREE.LineBasicMaterial({ color: loc.color });
            const cave = new THREE.LineSegments(caveEdges, caveMaterial);
            cave.position.set(0, groundHeight + terrainSize * 0.8, 0);
            locationGroup.add(cave);
        }

        // 地形特有の装飾（サイズに応じてスケール調整）
        const scale = terrainSize / 4; // 基準サイズ4に対するスケール
        switch(loc.name) {
            case "木":
                // 木の実
                for(let i = 0; i < 3; i++) {
                    const fruitGeometry = new THREE.SphereGeometry(0.2 * scale, 8, 8);
                    const fruitEdges = new THREE.EdgesGeometry(fruitGeometry);
                    const fruit = new THREE.LineSegments(fruitEdges, new THREE.LineBasicMaterial({ color: 0xFF6347 }));
                    fruit.position.set(
                        Math.cos(i * Math.PI/1.5) * 0.8 * scale,
                        groundHeight + 2.2 * scale,
                        Math.sin(i * Math.PI/1.5) * 0.8 * scale
                    );
                    locationGroup.add(fruit);
                }
                break;

            case "草原":
                // 草の束
                for(let i = 0; i < 8; i++) {
                    const grassGeometry = new THREE.CylinderGeometry(0.05 * scale, 0.05 * scale, 0.8 * scale, 4);
                    const grassEdges = new THREE.EdgesGeometry(grassGeometry);
                    const grass = new THREE.LineSegments(grassEdges, new THREE.LineBasicMaterial({ color: 0x228B22 }));
                    grass.position.set(
                        Math.cos(i * Math.PI/4) * 2 * scale,
                        groundHeight + 0.4 * scale,
                        Math.sin(i * Math.PI/4) * 2 * scale
                    );
                    locationGroup.add(grass);
                }
                break;

            case "池":
                // 水しぶきの表現
                for(let i = 0; i < 6; i++) {
                    const splashGeometry = new THREE.SphereGeometry(0.1 * scale, 4, 4);
                    const splashEdges = new THREE.EdgesGeometry(splashGeometry);
                    const splash = new THREE.LineSegments(splashEdges, new THREE.LineBasicMaterial({ color: 0x87CEEB }));
                    splash.position.set(
                        Math.cos(i * Math.PI/3) * 0.6 * scale,
                        groundHeight + 0.1 * scale,
                        Math.sin(i * Math.PI/3) * 0.6 * scale
                    );
                    locationGroup.add(splash);
                }
                break;

            case "倒木":
                // 木の枝
                for(let i = 0; i < 3; i++) {
                    const branchGeometry = new THREE.CylinderGeometry(0.1 * scale, 0.1 * scale, 0.8 * scale, 4);
                    const branchEdges = new THREE.EdgesGeometry(branchGeometry);
                    const branch = new THREE.LineSegments(branchEdges, new THREE.LineBasicMaterial({ color: 0x654321 }));
                    branch.position.set(
                        Math.cos(i * Math.PI/1.5) * 0.6 * scale,
                        groundHeight + 0.1 * scale,
                        Math.sin(i * Math.PI/1.5) * 0.6 * scale
                    );
                    branch.rotation.z = Math.PI / 2;
                    locationGroup.add(branch);
                }
                break;

            case "大きな石":
                // 小さな石
                for(let i = 0; i < 4; i++) {
                    const smallRockGeometry = new THREE.DodecahedronGeometry(0.3 * scale);
                    const smallRockEdges = new THREE.EdgesGeometry(smallRockGeometry);
                    const smallRock = new THREE.LineSegments(smallRockEdges, new THREE.LineBasicMaterial({ color: 0x696969 }));
                    smallRock.position.set(
                        Math.cos(i * Math.PI/2) * 1.2 * scale,
                        groundHeight + 0.3 * scale,
                        Math.sin(i * Math.PI/2) * 1.2 * scale
                    );
                    locationGroup.add(smallRock);
                }
                break;

            case "洞穴":
                // 洞穴の入り口の装飾
                const entranceGeometry = new THREE.RingGeometry(0.6 * scale, 0.8 * scale, 8);
                const entranceEdges = new THREE.EdgesGeometry(entranceGeometry);
                const entrance = new THREE.LineSegments(entranceEdges, new THREE.LineBasicMaterial({ color: 0x2F4F4F }));
                entrance.rotation.x = Math.PI / 2;
                entrance.position.set(0, groundHeight + 0.1, 0);
                locationGroup.add(entrance);
                break;

            case "川":
                // 川の流れの表現
                for(let i = 0; i < 8; i++) {
                    const flowGeometry = new THREE.SphereGeometry(0.05 * scale, 4, 4);
                    const flowEdges = new THREE.EdgesGeometry(flowGeometry);
                    const flow = new THREE.LineSegments(flowEdges, new THREE.LineBasicMaterial({ color: 0x87CEEB }));
                    flow.position.set(
                        (Math.random() - 0.5) * 0.8 * scale,
                        groundHeight + 0.05 * scale,
                        (Math.random() - 0.5) * 2 * scale
                    );
                    locationGroup.add(flow);
                }
                break;
        }

        // 位置を設定
        locationGroup.position.set(loc.x, 0, loc.z);
        scene.add(locationGroup);
        
        // 場所オブジェクトを作成
        const location = {
            name: loc.name,
            position: { x: loc.x, y: groundHeight, z: loc.z },
            color: loc.color,
            activities: loc.activities,
            atmosphere: loc.atmosphere,
            mesh: locationGroup,
            isHome: false
        };
        
        locations.push(location);
    });
    */

    // 動物のねぐら（自宅）を作成
    animalPersonalities.forEach(animal => {
        // homeオブジェクトが存在しない場合はスキップ
        if (!animal.home) {
            return;
        }
        
        const denGroup = new THREE.Group();
        
        // ねぐらのサイズ（より大きく目立つように）
        const denSize = 3;
        const denHeight = 2;
        
        // 地形の高さを取得
        const groundHeight = getTerrainHeight(animal.home.x, animal.home.z);
        
        // 動物の種類に応じてねぐらの形状を変更
        let denGeometry, denMaterial;
        
        if (animal.type === 'ライオン') {
            // ライオンは洞穴風のねぐら
            denGeometry = new THREE.SphereGeometry(denSize * 0.8, 8, 8);
            denMaterial = new THREE.LineBasicMaterial({ color: 0x8B4513, linewidth: 3 });
        } else if (animal.type === 'ゾウ') {
            // ゾウは大きな岩風のねぐら
            denGeometry = new THREE.DodecahedronGeometry(denSize * 0.6);
            denMaterial = new THREE.LineBasicMaterial({ color: 0x808080, linewidth: 3 });
        } else if (animal.type === 'キリン') {
            // キリンは木風のねぐら
            denGeometry = new THREE.CylinderGeometry(denSize * 0.3, denSize * 0.4, denHeight * 1.5, 8);
            denMaterial = new THREE.LineBasicMaterial({ color: 0xFFD700, linewidth: 3 });
        } else if (animal.type === 'シマウマ') {
            // シマウマは草原風のねぐら
            denGeometry = new THREE.CylinderGeometry(denSize * 0.8, denSize * 0.8, denHeight * 0.3, 8);
            denMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 3 });
        } else if (animal.type === 'ハイエナ') {
            // ハイエナは洞穴風のねぐら
            denGeometry = new THREE.SphereGeometry(denSize * 0.7, 8, 8);
            denMaterial = new THREE.LineBasicMaterial({ color: 0x696969, linewidth: 3 });
        } else {
            // デフォルト
            denGeometry = new THREE.BoxGeometry(denSize, denHeight, denSize);
            denMaterial = new THREE.LineBasicMaterial({ color: animal.home.color, linewidth: 3 });
        }
        
        const denEdges = new THREE.EdgesGeometry(denGeometry);
        const den = new THREE.LineSegments(denEdges, denMaterial);
        den.position.set(0, groundHeight + denHeight / 2, 0);
        denGroup.add(den);
        
        // ねぐらの上に動物の名前を表示する旗
        const flagGeometry = new THREE.PlaneGeometry(1, 0.5);
        const flagEdges = new THREE.EdgesGeometry(flagGeometry);
        const flagMaterial = new THREE.LineBasicMaterial({ color: 0xFF0000, linewidth: 2 });
        const flag = new THREE.LineSegments(flagEdges, flagMaterial);
        flag.position.set(0, groundHeight + denHeight + 1, 0);
        flag.rotation.x = -Math.PI / 2;
        denGroup.add(flag);
        
        // 旗のポール
        const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 4);
        const poleEdges = new THREE.EdgesGeometry(poleGeometry);
        const poleMaterial = new THREE.LineBasicMaterial({ color: 0x8B4513, linewidth: 2 });
        const pole = new THREE.LineSegments(poleEdges, poleMaterial);
        pole.position.set(0, groundHeight + denHeight + 0.5, 0);
        denGroup.add(pole);

        // 位置を設定
        denGroup.position.set(animal.home.x, 0, animal.home.z);
        scene.add(denGroup);
        
        // 場所オブジェクトを作成
        const denLocation = {
            name: animal.home.name,
            position: { x: animal.home.x, y: groundHeight, z: animal.home.z },
            color: animal.home.color,
            activities: ["休息", "睡眠", "家族との時間"],
            atmosphere: `${animal.name}の安全な住処`,
            mesh: denGroup,
            isHome: true,
            animalType: animal.type,
            animalName: animal.name
        };
        
        locations.push(denLocation);
    });
}

// 地形情報を取得する関数
function getTerrainInfo(terrainName) {
    const terrainInfo = {
        "川": {
            color: 0x4169E1,
            activities: ["水を飲む", "水浴びする", "泳ぐ", "魚を捕る", "川沿いを歩く"],
            atmosphere: "清らかな水が流れる川で、動物たちが集まる場所"
        },
        "木": {
            color: 0x228B22,
            activities: ["木の葉を食べる", "木陰で休む", "木に登る", "木の実を食べる"],
            atmosphere: "大きな木が生い茂り、動物たちの憩いの場"
        },
        "洞穴": {
            color: 0x696969,
            activities: ["休む", "眠る", "身を隠す", "子育てする"],
            atmosphere: "暗くて安全な避難所"
        },
        "草原": {
            color: 0x90EE90,
            activities: ["草を食べる", "走る", "遊ぶ", "群れで移動する"],
            atmosphere: "広大な草原で、動物たちが自由に動き回れる"
        },
        "倒木": {
            color: 0x8B4513,
            activities: ["隠れる", "休む", "獲物を待つ", "木の実を食べる"],
            atmosphere: "倒れた大きな木が、動物たちの隠れ家になっている"
        },
        "池": {
            color: 0x4169E1,
            activities: ["水を飲む", "水浴びする", "泳ぐ", "魚を捕る"],
            atmosphere: "澄んだ水が流れる池で、動物たちが集まる場所"
        },
        "大きな石": {
            color: 0x708090,
            activities: ["石の上で休む", "見張りをする", "日光浴する", "石陰で休む"],
            atmosphere: "大きな岩が点在し、動物たちの休憩場所"
        }
    };
    
    return terrainInfo[terrainName] || {
        color: 0x808080,
        activities: ["活動"],
        atmosphere: "一般的な地形"
    };
}

// 地形サイズを取得する関数
function getTerrainSize(terrainName) {
    const terrainSizes = {
        "川": 6,
        "木": 3,
        "洞穴": 4,
        "草原": 8,
        "倒木": 3,
        "池": 5,
        "大きな石": 4
    };
    
    return terrainSizes[terrainName] || 4;
}

