// グローバル変数
let scene, camera, renderer;
let agents = [];
let locations = [];
let apiKey = '';
let simulationRunning = false;
let simulationPaused = false;
let timeSpeed = 1;
let currentTime = 8 * 60; // 8:00 AM in minutes
const clock = new THREE.Clock();

// カメラ制御用インデックス
let currentAgentIndex = 0;
let currentFacilityIndex = 0;

// カメラモード管理
let cameraMode = 'free'; // 'free', 'agent', 'facility'
let targetAgent = null;
let targetFacility = null;
let cameraFollowEnabled = false;

// 時間制御用の変数
let lastTimeUpdate = 0;
let timeUpdateInterval = 0.1; // 0.1秒ごとに時間を更新（1xの場合）

// カメラ制御用の変数
let cameraControls = {
    moveSpeed: 0.5,
    rotateSpeed: 0.002,
    zoomSpeed: 0.1,
    keys: {
        w: false,
        a: false,
        s: false,
        d: false,
        q: false, // 上昇
        e: false  // 下降
    },
    mouse: {
        x: 0,
        y: 0,
        isDown: false,
        lastX: 0,
        lastY: 0
    }
};

// APIキー設定
function setApiKey() {
    const apiKeyInput = document.getElementById('apiKey');
    const apiStatus = document.getElementById('apiStatus');
    
    if (apiKeyInput && apiKeyInput.value.trim() !== '') {
        apiKey = apiKeyInput.value.trim();
        apiStatus.textContent = 'ステータス: 設定済み';
        apiStatus.style.color = '#4CAF50';
        addLog('🔑 APIキーが設定されました', 'system');
        
        // ローカルストレージに保存
        localStorage.setItem('savanna_apiKey', apiKey);
        localStorage.setItem('savanna_apiProvider', getSelectedApiProvider());
    } else {
        apiStatus.textContent = 'ステータス: エラー - APIキーを入力してください';
        apiStatus.style.color = '#f44336';
        addLog('❌ APIキーが入力されていません', 'error');
    }
}

// 保存されたAPIキーを読み込み
function loadSavedApiKey() {
    const savedApiKey = localStorage.getItem('savanna_apiKey');
    const savedProvider = localStorage.getItem('savanna_apiProvider');
    
    if (savedApiKey) {
        apiKey = savedApiKey;
        const apiKeyInput = document.getElementById('apiKey');
        const apiProviderSelect = document.getElementById('apiProvider');
        const apiStatus = document.getElementById('apiStatus');
        
        if (apiKeyInput) {
            apiKeyInput.value = savedApiKey;
        }
        if (savedProvider && apiProviderSelect) {
            apiProviderSelect.value = savedProvider;
        }
        if (apiStatus) {
            apiStatus.textContent = 'ステータス: 設定済み';
            apiStatus.style.color = '#4CAF50';
        }
    }
}

// APIキーをクリア
function clearApiKey() {
    apiKey = '';
    const apiKeyInput = document.getElementById('apiKey');
    const apiStatus = document.getElementById('apiStatus');
    
    if (apiKeyInput) {
        apiKeyInput.value = '';
    }
    if (apiStatus) {
        apiStatus.textContent = 'ステータス: 未設定';
        apiStatus.style.color = '#666';
    }
    
    localStorage.removeItem('savanna_apiKey');
    localStorage.removeItem('savanna_apiProvider');
    addLog('🗑️ APIキーがクリアされました', 'system');
}

// 選択されたAPIプロバイダーを取得
function getSelectedApiProvider() {
    const apiProviderSelect = document.getElementById('apiProvider');
    return apiProviderSelect ? apiProviderSelect.value : 'openai';
}

// APIキーの検証
function validateApiKey() {
    if (!apiKey || apiKey.trim() === '') {
        addLog('⚠️ APIキーが設定されていません。動物の思考機能が制限されます。', 'warning');
        return false;
    }
    return true;
}

// LLM API呼び出し関数
async function callLLM({ prompt, systemPrompt, maxTokens = 200, temperature = 0.8, provider = 'openai' }) {
    if (!apiKey || apiKey.trim() === '') {
        throw new Error('APIキーが設定されていません');
    }

    const headers = {
        'Content-Type': 'application/json'
    };

    let url, body;

    switch (provider) {
        case 'openai':
            url = 'https://api.openai.com/v1/chat/completions';
            headers['Authorization'] = `Bearer ${apiKey}`;
            body = {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                max_tokens: maxTokens,
                temperature: temperature
            };
            break;

        case 'anthropic':
            url = 'https://api.anthropic.com/v1/messages';
            headers['x-api-key'] = apiKey;
            headers['anthropic-version'] = '2023-06-01';
            body = {
                model: 'claude-3-haiku-20240307',
                max_tokens: maxTokens,
                temperature: temperature,
                messages: [
                    { role: 'user', content: `${systemPrompt}\n\n${prompt}` }
                ]
            };
            break;

        case 'google':
            url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
            body = {
                contents: [{
                    parts: [{
                        text: `${systemPrompt}\n\n${prompt}`
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: maxTokens,
                    temperature: temperature
                }
            };
            // Google APIキーはURLパラメータとして送信
            url += `?key=${apiKey}`;
            break;

        default:
            throw new Error('サポートされていないAPIプロバイダーです');
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`API呼び出しエラー: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // プロバイダー別のレスポンス解析
        switch (provider) {
            case 'openai':
                return data.choices[0]?.message?.content || '';
            case 'anthropic':
                return data.content[0]?.text || '';
            case 'google':
                return data.candidates[0]?.content?.parts[0]?.text || '';
            default:
                return '';
        }
    } catch (error) {
        console.error('API呼び出しエラー:', error);
        throw error;
    }
}

// Three.jsの初期化
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // 空色の背景（サバンナの空）
    scene.fog = new THREE.Fog(0x87CEEB, 150, 400); // フォグを追加
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // 地形の高さを取得してカメラの位置を調整
    const terrainHeight = getTerrainHeight(0, 0);
    camera.position.set(0, terrainHeight + 200, 60); // 高さと距離を増加
    camera.lookAt(0, terrainHeight, 0); // 地形の高さを見る
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // ライティング（サバンナの太陽光）
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(20, 30, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // サバンナのレイアウトを生成
    cityLayout = new CityLayout();
    cityLayout.generateRoads();
    //cityLayout.placeBuildings();

    // 地形システムの初期化
    initTerrain();

    // 地形の作成（個別の地形オブジェクト）
    createLocations();
    
    // マウスコントロール
    setupMouseControls();
    
    // アニメーションループ
    animate();

    // 道路の描画（サバンナでは不要だが、既存のコードを維持）
    cityLayout.drawRoads();
    
    // 建物の描画（地形として描画）
    cityLayout.drawBuildings();
    
    // 施設の描画（地形として描画）
    cityLayout.drawFacilities();

    // パネルのHTMLを更新
    updatePanelHTML();
    
    // パネルのドラッグ機能を設定
    setupPanelDrag();

    // カメラ制御ボタンのイベント登録
    const personBtn = document.getElementById('personViewBtn');
    const facilityBtn = document.getElementById('facilityViewBtn');
    const resetBtn = document.getElementById('resetCamera');

    if (personBtn) {
        personBtn.addEventListener('click', () => {
            if (agents.length === 0) {
                addLog('⚠️ 動物がまだ作成されていません', 'warning');
                return;
            }
            currentAgentIndex = (currentAgentIndex + 1) % agents.length;
            focusCameraOnAgentByIndex(currentAgentIndex);
        });
    }
    if (facilityBtn) {
        facilityBtn.addEventListener('click', () => {
            const facilities = locations.filter(loc => !loc.isHome);
            if (facilities.length === 0) {
                addLog('⚠️ 地形がまだ作成されていません', 'warning');
                return;
            }
            currentFacilityIndex = (currentFacilityIndex + 1) % facilities.length;
            focusCameraOnFacilityByIndex(currentFacilityIndex);
        });
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', resetCamera);
    }

    // 道路表示ボタンのイベント登録（サバンナでは不要だが、既存のコードを維持）
    const toggleRoadBtn = document.getElementById('toggleRoadNetwork');
    const clearRoadBtn = document.getElementById('clearRoadVisualization');

    if (toggleRoadBtn) {
        toggleRoadBtn.addEventListener('click', () => {
            cityLayout.visualizeRoadNetwork();
            addLog('🛣️ 地形ネットワークの視覚化を開始しました', 'system');
        });
    }
    if (clearRoadBtn) {
        clearRoadBtn.addEventListener('click', () => {
            cityLayout.clearRoadNetworkVisualization();
            cityLayout.clearPathVisualization();
            addLog('🗑️ 地形表示をクリアしました', 'system');
        });
    }

    // ウィンドウリサイズ対応
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // 保存されたAPIキーを読み込み
    loadSavedApiKey();
    
    // APIキーの検証
    validateApiKey();
}

// マウスコントロール
function setupMouseControls() {
    let isPanelDragging = false; // パネルドラッグ中かどうかのフラグ
    
    // キーボードイベント
    document.addEventListener('keydown', (event) => {
        if (cameraMode !== 'free') return; // フリーカメラモードのみ
        
        switch(event.code) {
            case 'KeyW': cameraControls.keys.w = true; break;
            case 'KeyA': cameraControls.keys.a = true; break;
            case 'KeyS': cameraControls.keys.s = true; break;
            case 'KeyD': cameraControls.keys.d = true; break;
            case 'KeyQ': cameraControls.keys.q = true; break;
            case 'KeyE': cameraControls.keys.e = true; break;
        }
    });
    
    document.addEventListener('keyup', (event) => {
        if (cameraMode !== 'free') return; // フリーカメラモードのみ
        
        switch(event.code) {
            case 'KeyW': cameraControls.keys.w = false; break;
            case 'KeyA': cameraControls.keys.a = false; break;
            case 'KeyS': cameraControls.keys.s = false; break;
            case 'KeyD': cameraControls.keys.d = false; break;
            case 'KeyQ': cameraControls.keys.q = false; break;
            case 'KeyE': cameraControls.keys.e = false; break;
        }
    });
    
    // マウスイベント
    document.addEventListener('mousemove', (event) => {
        // 動物視点モード中はマウス操作を無効
        if (cameraMode === 'agent' && cameraFollowEnabled) {
            return;
        }
        
        cameraControls.mouse.x = event.clientX;
        cameraControls.mouse.y = event.clientY;
        
        if (cameraControls.mouse.isDown && !isPanelDragging && cameraMode === 'free') {
            const deltaX = event.clientX - cameraControls.mouse.lastX;
            const deltaY = event.clientY - cameraControls.mouse.lastY;
            
            // カメラの回転（視点の変更）
            const rotationX = camera.rotation.x - deltaY * cameraControls.rotateSpeed;
            const rotationY = camera.rotation.y - deltaX * cameraControls.rotateSpeed;
            
            // 上下の回転を制限（-85度〜85度）
            camera.rotation.x = Math.max(-Math.PI * 0.47, Math.min(Math.PI * 0.47, rotationX));
            camera.rotation.y = rotationY;
        }
        
        cameraControls.mouse.lastX = event.clientX;
        cameraControls.mouse.lastY = event.clientY;
    });
    
    document.addEventListener('mousedown', (event) => {
        if (cameraMode === 'free') {
            cameraControls.mouse.isDown = true;
            cameraControls.mouse.lastX = event.clientX;
            cameraControls.mouse.lastY = event.clientY;
        }
    });
    
    document.addEventListener('mouseup', () => {
        cameraControls.mouse.isDown = false;
    });
    
    // ホイールイベント（ズーム）
    document.addEventListener('wheel', (event) => {
        // 動物視点モード中はズーム操作を無効
        if (cameraMode === 'agent' && cameraFollowEnabled) {
            return;
        }
        
        if (!isPanelDragging && cameraMode === 'free') {
            const zoomDirection = event.deltaY > 0 ? 1 : -1;
            const zoomAmount = zoomDirection * cameraControls.zoomSpeed;
            
            // カメラの前方向に移動（ズーム）
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(camera.quaternion);
            direction.multiplyScalar(zoomAmount * 10);
            
            camera.position.add(direction);
            
            // 地形の高さを考慮した高さ調整
            const terrainHeight = getTerrainHeight(camera.position.x, camera.position.z);
            const minHeight = terrainHeight + 20;
            const maxHeight = terrainHeight + 500;
            
            camera.position.y = Math.max(minHeight, Math.min(maxHeight, camera.position.y));
        }
    });

    // パネルドラッグ状態を監視する関数をグローバルに公開
    window.setPanelDragging = function(dragging) {
        isPanelDragging = dragging;
    };
}

// 動物の作成
function createAnimals() {
    // 地形が作成されていない場合は作成
    if (locations.length === 0) {
        addLog('⚠️ 地形が作成されていません。地形を作成してから動物を作成します。', 'warning');
        createLocations();
    }
    
    animalPersonalities.forEach((animalData, index) => {
        // 動物の初期位置を動的に生成
        const homeLocation = findSuitableHomeLocation(animalData.type, index);
        
        // homeオブジェクトを作成
        animalData.home = {
            name: `${animalData.name}の${animalData.type === 'ライオン' || animalData.type === 'ハイエナ' ? '洞穴' : '休息地'}`,
            x: homeLocation.x,
            z: homeLocation.z,
            color: animalData.color,
            terrainType: homeLocation.terrainType
        };
        
        const animal = new Animal(animalData, index);
        agents.push(animal);
    });
    
    // 動物作成後、すぐに行動を開始させる
    agents.forEach(animal => {
        if (animal.isAlive) {
            // 初期行動を設定
            setTimeout(() => {
                animal.executeDefaultAction();
            }, 1000 + Math.random() * 2000); // 1-3秒後に行動開始
        }
    });
    
    addLog(`🦁 サバンナに${agents.length}匹の動物が誕生しました`, 'system');
}

// 時間の更新
function updateTime() {
    const now = clock.getElapsedTime();
    if (now - lastTimeUpdate >= timeUpdateInterval) {
        currentTime += timeSpeed;
        if (currentTime >= 24 * 60) {
            currentTime = 0; // 24時間でリセット
        }
        lastTimeUpdate = now;
        
        // 時間表示の更新
        const hours = Math.floor(currentTime / 60);
        const minutes = currentTime % 60;
        const timeDisplay = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        const timeElement = document.getElementById('time-display');
        if (timeElement) {
            timeElement.textContent = timeDisplay;
        }
        
        // 環境の更新
        updateEnvironment(hours);
    }
}

// 環境の更新
function updateEnvironment(hour) {
    // 時間帯に応じた環境変化
    if (hour >= 6 && hour < 18) {
        // 昼間
        scene.background = new THREE.Color(0x87CEEB); // 明るい空色
        if (scene.fog) {
            scene.fog.color.setHex(0x87CEEB);
        }
    } else {
        // 夜間
        scene.background = new THREE.Color(0x1a1a2e); // 暗い夜空
        if (scene.fog) {
            scene.fog.color.setHex(0x1a1a2e);
        }
    }
    
    // 動物の行動パターンの更新
    agents.forEach(animal => {
        if (animal.isAlive) {
            const timeOfDay = animal.getTimeOfDay();
            // 時間帯に応じた行動の調整
            if (timeOfDay === 'night' && animal.type !== 'ハイエナ') {
                // 夜行性でない動物は夜に休息
                animal.energy = Math.min(1.0, animal.energy + 0.01);
            }
        }
    });
}

// 動物情報の更新
function updateAgentInfo() {
    const agentInfoContainer = document.getElementById('agent-info');
    if (!agentInfoContainer) return;
    
    let html = '<h3>サバンナの動物たち</h3>';
    
    // 動物の種類別にグループ化
    const animalGroups = {};
    agents.forEach(animal => {
        if (!animalGroups[animal.type]) {
            animalGroups[animal.type] = [];
        }
        animalGroups[animal.type].push(animal);
    });
    
    Object.keys(animalGroups).forEach(type => {
        html += `<h4>${type}</h4>`;
        animalGroups[type].forEach(animal => {
            const status = animal.isAlive ? '🟢' : '🔴';
            const hpPercentage = animal.isAlive ? (animal.hp / animal.maxHp * 100).toFixed(0) : 0;
            const hungerPercentage = (animal.hunger * 100).toFixed(0);
            const thirstPercentage = (animal.thirst * 100).toFixed(0);
            
            html += `
                <div class="animal-info" onclick="selectAnimal('${animal.name}')">
                    <span class="animal-status">${status}</span>
                    <span class="animal-name">${animal.name}</span>
                    <span class="animal-hp">HP: ${hpPercentage}%</span>
                    <span class="animal-hunger">空腹: ${hungerPercentage}%</span>
                    <span class="animal-thirst">喉の渇き: ${thirstPercentage}%</span>
                    <span class="animal-location">${animal.currentLocation?.name || '不明'}</span>
                </div>
            `;
        });
    });
    
    agentInfoContainer.innerHTML = html;
}

// 動物選択
function selectAnimal(animalName) {
    const animal = agents.find(a => a.name === animalName);
    if (animal) {
        // カメラを動物にフォーカス
        focusCameraOnAgent(animal);
        
        // 選択された動物の詳細情報を表示
        const selectedAnimalInfo = document.getElementById('selected-animal-info');
        if (selectedAnimalInfo) {
            const animalInfo = animalTypes[animal.type];
            selectedAnimalInfo.innerHTML = `
                <h3>${animal.name} (${animal.type})</h3>
                <p><strong>年齢:</strong> ${animal.age}歳</p>
                <p><strong>性格:</strong> ${animal.personality.description}</p>
                <p><strong>HP:</strong> ${animal.hp}/${animal.maxHp}</p>
                <p><strong>空腹度:</strong> ${(animal.hunger * 100).toFixed(1)}%</p>
                <p><strong>喉の渇き:</strong> ${(animal.thirst * 100).toFixed(1)}%</p>
                <p><strong>現在地:</strong> ${animal.currentLocation?.name || '不明'}</p>
                <p><strong>状態:</strong> ${animal.isAlive ? '生存' : '死亡'}</p>
                <p><strong>説明:</strong> ${animalInfo?.description || ''}</p>
                <p><strong>攻撃力:</strong> ${animal.attackPower}</p>
                <p><strong>防御力:</strong> ${animal.defense}</p>
                <p><strong>速度:</strong> ${animal.speed}</p>
            `;
        }
    }
}

// シミュレーション開始
function startSimulation() {
    if (simulationRunning) return;
    
    simulationRunning = true;
    simulationPaused = false;
    
    // 地形が作成されていない場合は作成
    if (locations.length === 0) {
        addLog('🌍 地形を作成しています...', 'system');
        createLocations();
    }
    
    // 動物がまだ作成されていない場合は作成
    if (agents.length === 0) {
        createAnimals();
    }
    
    addLog('🦁 サバンナシミュレーションを開始しました', 'system');
    
    // 開始ボタンの状態を更新
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    if (startBtn) startBtn.disabled = true;
    if (pauseBtn) pauseBtn.disabled = false;
}

// シミュレーション一時停止
function pauseSimulation() {
    if (!simulationRunning) return;
    
    simulationPaused = !simulationPaused;
    
    if (simulationPaused) {
        addLog('⏸️ シミュレーションを一時停止しました', 'system');
    } else {
        addLog('▶️ シミュレーションを再開しました', 'system');
    }
    
    // ボタンの状態を更新
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
        pauseBtn.textContent = simulationPaused ? '再開' : '一時停止';
    }
}

// 時間速度の設定
function setTimeSpeed() {
    const speedSelect = document.getElementById('timeSpeed');
    if (speedSelect) {
        timeSpeed = parseInt(speedSelect.value);
        timeUpdateInterval = 0.1 / timeSpeed; // 時間速度に応じて更新間隔を調整
        addLog(`⏱️ 時間速度を${timeSpeed}xに設定しました`, 'system');
    }
}

// アニメーションループ
function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta() * 1000; // ミリ秒単位
    
    if (simulationRunning && !simulationPaused) {
        // 時間の更新
        updateTime();
        
        // 動物の更新
        agents.forEach(animal => {
            if (animal.isAlive) {
                animal.update(deltaTime);
            }
        });
        
        // 動物情報の更新
        updateAgentInfo();
    }
    
    // カメラの移動を更新（フリーカメラモード時）
    updateCameraMovement(deltaTime);
    
    // カメラフォローの更新（シミュレーション状態に関係なく実行）
    updateCameraFollow();
    
    // 地形システムの更新
    updateTerrain();
    
    renderer.render(scene, camera);
}

// カメラターゲット表示の更新
function updateCameraTargetDisplay() {
    const targetDisplay = document.getElementById('camera-target');
    if (!targetDisplay) return;
    
    if (cameraMode === 'agent' && targetAgent) {
        targetDisplay.textContent = `動物: ${targetAgent.name}`;
    } else if (cameraMode === 'facility' && targetFacility) {
        targetDisplay.textContent = `地形: ${targetFacility.name}`;
    } else {
        targetDisplay.textContent = 'フリーカメラ';
    }
}

// カメラモード表示の更新
function updateCameraModeDisplay() {
    const modeDisplay = document.getElementById('camera-mode');
    if (!modeDisplay) return;
    
    switch (cameraMode) {
        case 'free':
            modeDisplay.textContent = 'フリー';
            break;
        case 'agent':
            modeDisplay.textContent = '動物追従';
            break;
        case 'facility':
            modeDisplay.textContent = '地形固定';
            break;
    }
}

// インデックスで動物にカメラをフォーカス
function focusCameraOnAgentByIndex(index) {
    if (index >= 0 && index < agents.length) {
        const agent = agents[index];
        focusCameraOnAgent(agent);
    }
}

// 動物にカメラをフォーカス
function focusCameraOnAgent(agent) {
    if (!agent || !agent.isAlive) return;
    
    cameraMode = 'agent';
    targetAgent = agent;
    cameraFollowEnabled = true;
    
    // カメラを動物の位置に移動（地形の高さを考慮）
    const agentPosition = agent.mesh.position;
    const terrainHeight = getTerrainHeight(agentPosition.x, agentPosition.z);
    
    // より安定したカメラ位置を設定
    const cameraOffset = new THREE.Vector3(-10, 15, 10);
    const targetPosition = new THREE.Vector3(
        agentPosition.x + cameraOffset.x,
        Math.max(agentPosition.y + cameraOffset.y, terrainHeight + 20),
        agentPosition.z + cameraOffset.z
    );
    
    // スムーズなカメラ移動
    camera.position.lerp(targetPosition, 0.1);
    
    // カメラの向きを動物に向ける
    const lookAtPosition = new THREE.Vector3(
        agentPosition.x,
        agentPosition.y + 2, // 動物の少し上を見る
        agentPosition.z
    );
    camera.lookAt(lookAtPosition);
    
    updateCameraTargetDisplay();
    updateCameraModeDisplay();
    
    addLog(`📷 カメラが${agent.name}にフォーカスしました`, 'camera');
}

// インデックスで地形にカメラをフォーカス
function focusCameraOnFacilityByIndex(index) {
    const facilities = locations.filter(loc => !loc.isHome);
    if (index >= 0 && index < facilities.length) {
        const facility = facilities[index];
        focusCameraOnFacility(facility);
    }
}

// 地形にカメラをフォーカス
function focusCameraOnFacility(facility) {
    if (!facility) return;
    
    cameraMode = 'facility';
    targetFacility = facility;
    cameraFollowEnabled = false;
    
    // カメラを地形の位置に移動（地形の高さを考慮）
    const facilityPosition = facility.position;
    const terrainHeight = getTerrainHeight(facilityPosition.x, facilityPosition.z);
    
    camera.position.set(
        facilityPosition.x,
        Math.max(facilityPosition.y + 15, terrainHeight + 20), // 地形の高さも考慮
        facilityPosition.z + 12
    );
    camera.lookAt(facilityPosition.x, facilityPosition.y, facilityPosition.z);
    
    updateCameraTargetDisplay();
    updateCameraModeDisplay();
    
    addLog(`📷 カメラが${facility.name}にフォーカスしました`, 'camera');
}

// カメラリセット
function resetCamera() {
    cameraMode = 'free';
    targetAgent = null;
    targetFacility = null;
    cameraFollowEnabled = false;
    
    // 地形の高さを取得してカメラの位置を調整
    const terrainHeight = getTerrainHeight(0, 0);
    camera.position.set(0, terrainHeight + 200, 60); // ユーザーが設定した高さに合わせる
    
    // カメラの回転もリセット
    camera.rotation.set(0, 0, 0);
    
    updateCameraTargetDisplay();
    updateCameraModeDisplay();
    
    addLog('📷 カメラをリセットしました', 'camera');
}

// カメラフォローの更新
function updateCameraFollow() {
    if (cameraMode === 'agent' && targetAgent && cameraFollowEnabled && targetAgent.isAlive) {
        const agentPosition = targetAgent.mesh.position;
        const terrainHeight = getTerrainHeight(agentPosition.x, agentPosition.z);
        
        // 動物の移動速度に応じてカメラの追従速度を調整
        const followSpeed = targetAgent.movementTarget ? 0.1 : 0.05; // 移動中は速く、停止中は遅く
        
        // より安定したカメラ位置を設定
        const cameraOffset = new THREE.Vector3(-10, 15, 10);
        const targetPosition = new THREE.Vector3(
            agentPosition.x + cameraOffset.x,
            Math.max(agentPosition.y + cameraOffset.y, terrainHeight + 20),
            agentPosition.z + cameraOffset.z
        );
        
        // スムーズなカメラ移動
        camera.position.lerp(targetPosition, followSpeed);
        
        // カメラの向きを動物に向ける
        const lookAtPosition = new THREE.Vector3(
            agentPosition.x,
            agentPosition.y + 2, // 動物の少し上を見る
            agentPosition.z
        );
        camera.lookAt(lookAtPosition);
        
        // カメラターゲット表示を更新
        updateCameraTargetDisplay();
    }
}

// カメラの移動を更新
function updateCameraMovement(deltaTime) {
    if (cameraMode !== 'free') return;
    
    const moveSpeed = cameraControls.moveSpeed * deltaTime;
    const direction = new THREE.Vector3();
    
    // WASDキーによる移動
    if (cameraControls.keys.w) {
        direction.z -= 1; // 前進
    }
    if (cameraControls.keys.s) {
        direction.z += 1; // 後退
    }
    if (cameraControls.keys.a) {
        direction.x -= 1; // 左移動
    }
    if (cameraControls.keys.d) {
        direction.x += 1; // 右移動
    }
    
    // 移動方向を正規化
    if (direction.length() > 0) {
        direction.normalize();
        
        // カメラの回転を考慮して移動方向を変換
        direction.applyQuaternion(camera.quaternion);
        direction.y = 0; // Y軸の移動は無効（水平移動のみ）
        direction.normalize();
        
        // カメラを移動
        camera.position.add(direction.multiplyScalar(moveSpeed));
    }
    
    // QEキーによる上下移動
    if (cameraControls.keys.q) {
        camera.position.y += moveSpeed;
    }
    if (cameraControls.keys.e) {
        camera.position.y -= moveSpeed;
    }
    
    // 地形の高さを考慮した高さ制限
    const terrainHeight = getTerrainHeight(camera.position.x, camera.position.z);
    const minHeight = terrainHeight + 20;
    const maxHeight = terrainHeight + 500;
    
    camera.position.y = Math.max(minHeight, Math.min(maxHeight, camera.position.y));
}

// 初期化
window.addEventListener('load', () => {
    init();
});



